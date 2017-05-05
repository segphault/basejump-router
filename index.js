const {createServer} = require("http");
const {EventEmitter} = require("events");

const Plugins = require("./src/plugins");
const Request = require("./src/request");
const Router = require("./src/router");

class Basejump extends EventEmitter {
  constructor(environment, plugins = []) {
    super();

    let plugs = Object.values(Plugins.default).concat(plugins);
    this.router = environment instanceof Router ? environment :
                  new Router(new Plugins(plugs), environment);
  }

  async request(req, res, next) {
    let request;

    try {
      request = new Request(req, res);
      request.route = await this.router.route(request);

      if (!request.route) {
        this.emit("request", request);
        return next ? next() : request.error("Not Found", 404);
      }

      if (["put", "post"].includes(request.method))
        await request.parse();

      this.emit("request", request);
      this.router.respond(await this.router.handle(request), request);
    }
    catch (err) {
      if (request) request.error(err);
      this.emit("failure", err);
    }
  }

  configure(config) {
    this.plugins.configure(config);
  }

  route(method, path, settings) {
    this.plugins.setItem("router", {method, path, settings}, "routes");
  }

  listen(...args) {
    return createServer(this.middleware).listen(...args);
  }

  get plugins() {
    return this.router.plugins;
  }

  get middleware() {
    return this.request.bind(this);
  }
}

for (let meth of Plugins.default.Router.methods)
  Basejump.prototype[meth] = function(...args) { this.route(meth, ...args) }

module.exports = {Basejump, Router, Request, Plugins};
