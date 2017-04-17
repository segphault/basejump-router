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
    if (headers) this.headers(headers, code);
    if (content.pipe) content.pipe(this.response)
    else this.response.end(content);
  }
  
  stream() {
    this.headers({"Content-Type": "text/event-stream", "Connection": "keep-alive"});
    this.response.setTimeout(0, () => "SSE Timeout Occured");
    
    return (event, data) =>
      this.response.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  error(err) {
    let headers = {"Content-Type": "text/plain"};
    if (typeof err === "string") this.send(err, headers, 400);
    else if (err.expose) this.send(err.message, headers, err.error);
    else this.send("Server Error", headers, 500);
  }
  
  onclose(cb) {
    this.response.connection.on("close", cb);
  }
}

module.exports = Request;
