const {parse} = require("url");

class ServerRequest {
  constructor(request, response) {
    this.request = request;
    this.response = response;
    this.url = parse(request.url, true);
    this.method = request.method.toLowerCase();
  }

  parse() {
    let body = "";
    return new Promise((resolve, reject) => {
      this.request.on("data", chunk => body += chunk);
      this.request.on("end", () => resolve({
        params: {
          query: this.url.query,
          body: body ? JSON.parse(body) : {},
          header: this.request.headers
        },
        method: this.method, path: this.url.pathname
      }));
    });
  }

  send(data) {
    this.response.setHeader("Content-Type", "application/json");
    this.response.end(JSON.stringify(data));
  }

  stream() {
    this.response.setHeader("Content-Type", "text/event-stream");
    this.response.setHeader("Connection", "keep-alive");
    this.response.write("event: update\n");
    return data => this.response.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  error(err, message) {
    this.response.writeHead(err, {"Content-Type": "text/plain"});
    this.response.end(message);
  }

  onclose(fn) {
    this.request.connection.on("close", fn);
  }

  handleError(err) {
    if (err.expose)
      return this.error(err.error, err.message);

    console.log("Request caused error:", err);
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
    return (req, res) => {
      let request = new this(req, res);
      request.parse().then(req => handler.handle(req))
                     .then(out => request.handle(out))
                     .catch(err => request.handleError(err));
    }
  }
}

module.exports = ServerRequest;
