const {parse} = require("url");
const {info, error} = require("./utils");

class ServerRequest {
  constructor(request, response) {
    this.request = request;
    this.response = response;

    this.method = request.method.toLowerCase();
    this.url = parse(request.url, true);
    this.path = this.url.pathname;
    this.ip = request.headers['x-forwarded-for'] ||
              request.connection.remoteAddress;

    this.params = {
      query: this.url.query,
      header: this.request.headers,
      body: null
    }
  }

  parse() {
    let body = "";
    return new Promise((resolve, reject) => {
      if (this.params.body) return resolve(this);
      this.request.on("data", chunk => body += chunk);
      this.request.on("end", () => {
        this.params.body = body ? JSON.parse(body) : {};
        resolve(this);
      });
    });
  }

  send(data) {
    if (typeof data === "string") {
      this.response.setHeader("Content-Type", "text/html");
      this.response.end(data);
    } else {
      this.response.setHeader("Content-Type", "application/json");
      this.response.end(JSON.stringify(data));
    }
  }

  stream() {
    this.response.setHeader("Content-Type", "text/event-stream");
    this.response.setHeader("Connection", "keep-alive");
    this.response.write("event: update\n");

    let interval = setInterval(() => this.response.write(" "), 30000);
    this.response.connection.on("close", () => clearInterval(interval));

    return data => this.response.write(`\ndata: ${JSON.stringify(data)}\n\n`);
  }

  error(err, message) {
    this.response.writeHead(err, {"Content-Type": "text/plain"});
    this.response.end(message);
  }

  onclose(fn) {
    this.request.connection.on("close", fn);
  }

  handleError(err) {
    if (typeof err === "string") return this.error(400, err);
    if (err.expose) return this.error(err.error, err.message);
    return this.error(500, "Server Error");
  }

  handle(output) {
    if (output && output.constructor.name === "EventEmitter") {
      output.on("update", this.stream());
      this.onclose(() => output.emit("close"));
    } else if (output && output.constructor.name === "Cursor") {
      let stream = this.stream();
      output.each((err, change) => stream(change));
      this.onclose(() => output.close());
    } else this.send(output);
  }

  static attach(handler) {
    return (req, res, next) => {
      let request = new this(req, res);
      let match = handler.match(request.method, request.path);

      if (!match) return next ? next() : next;
      info(`REQUEST: ${request.method} ${request.path} from ${request.ip}`);

      request.parse().then(req => handler.handle(req, match))
                     .then(out => request.handle(out))
                     .catch(err => {
                       error(`ERROR: ${err}`);
                       request.handleError(err);
                     });
    }
  }
}

module.exports = ServerRequest;
