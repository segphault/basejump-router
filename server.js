const {createServer} = require("http");
const Request = require("./request");
const Plugin = require("./plugins");

class Server extends Plugin {
  constructor(settings = {}) {
    super();
    this.settings = settings;
  }

  async request(request, next) {
    try {
      this.emit("request", request);

      let handled = await this[Plugin.middleware](Plugin.request, request);
      if (handled) return;
      
      if (next) next()
      else throw {message: "Not Found", code: 404};
    }
    catch (err) {
      this.error(request, err);
    }
  }
  
  error(request, error) {
    this.emit("failure", error);

    if (typeof error === "string")
      return request.json({error}, 400);

    if (error.expose || error.code < 500)
      return request.json({error: error.message}, error.code);

    request.json({error: "Server Error"}, 500);
  }

  start() {
    let {port = 8000, bind = "127.0.0.1"} = this.settings;
    this.listen(port, bind, () => this.emit("listen", {port, bind}));
  }

  attach(req, res, next) {
    this.request(new Request(req, res), next);
  }

  listen(...args) {
    return createServer(this.attach.bind(this)).listen(...args);
  }
}

module.exports = Server;