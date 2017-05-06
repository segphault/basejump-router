const {parse} = require("url");
const formidable = require("formidable");

const bodyParser = request =>
  new Promise((resolve, reject) => {
    let form = new formidable.IncomingForm();
    form.parse(request, (err, fields, files) =>
      err ? reject(err) : resolve({fields, files}))
  });

class Request {
  constructor(request, response) {
    this.request = request;
    this.response = response;

    this.method = request.method.toLowerCase();
    this.url = parse(request.url, true);
    this.path = this.url.pathname;

    this.params = {query: this.url.query, header: this.request.headers};
  }

  async parse() {
    let {fields, files} = await bodyParser(this.request);
    this.params.body = fields;
    this.params.files = files;
  }

  headers(headers, code=200) {
    this.response.writeHead(code, headers);
  }

  send(content, headers, code=200) {
    if (headers && typeof headers === "string")
      headers = {"Content-Type": headers};
    if (headers) this.headers(headers, code);

    if (content.pipe) content.pipe(this.response)
    else this.response.end(content);
  }

  json(content, code) {
    this.send(JSON.stringify(content), "application/json", code);
  }

  plain(content, code) {
    this.send(content, "text/plain", code);
  }

  stream() {
    this.headers({"Content-Type": "text/event-stream", "Connection": "keep-alive"});
    this.response.setTimeout(0, () => "SSE Timeout Occured");

    return (event, data) =>
      this.response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  throw(message, code=400) {
    throw {message, code, expose: code < 500}
  }

  error(err, code) {
    if (typeof err === "string")
      return this.plain(err, code || 400);

    if (err.expose) {
      if (err.message.constructor.name === "Object")
        this.json(err.message, err.code);
      else this.plain(err.message, err.code);
    }
    else this.plain("Server Error", code || 500);
  }

  onclose(cb) {
    this.response.connection.on("close", cb);
  }
}

module.exports = Request;
