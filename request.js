const {parse} = require("url");

class Request {
  constructor(request, response) {
    this.request = request;
    this.response = response;

    let url = parse(request.url, true);

    this.path = url.pathname;
    this.query = url.query;
    this.method = request.method;
    this.headers = request.headers;

    this.closed = new Promise(resolve => request.on("close", resolve));
  }

  [Symbol.asyncIterator]() {
    return this.request[Symbol.asyncIterator]();
  }

  respond({code, headers, body}) {
    this.response.writeHead(code, headers);
    if (body.pipe) body.pipe(this.response);
    else if (body[Symbol.asyncIterator]) this.stream(body);
    else this.response.end(body);
  }

  async stream(iter) {
    for await (let chunk of iter) 
      this.response.write(chunk);
  }

  json(body, code=200) {
    let headers = {"content-type": "application/json"};
    this.respond({code, headers, body: JSON.stringify(body)});
  }

  html(body, code=200) {
    let headers = {"content-type": "text/html"};
    this.respond({code, body, headers});
  }
}

module.exports = Request;
