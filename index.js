const {createServer} = require("http");
const {EventEmitter} = require("events");

const Settings = require("./src/settings");
const Request = require("./src/request");
const Router = require("./src/router");

const Plugins = {
  Router: require("./src/plugins/router"),
  Schema: require("./src/plugins/schema"),
  Static: require("./src/plugins/static"),
  Realtime: require("./src/plugins/realtime")
};

class Basejump extends EventEmitter {
  constructor({router, config, environment, plugins = []} = {}) {
    super();
    let p = Object.values(Plugins).concat(plugins);
    this.router = router || new Router(new Settings(p, config), environment);
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

  route(method, path, settings) {
    this.settings.setItem("router", {method, path, settings}, "routes");
  }

  listen(...args) {
    return createServer(this.middleware).listen(...args);
  }

  get settings() {
    return this.router.settings;
  }

  get middleware() {
    return this.request.bind(this);
  }
}

for (let meth of Plugins.Router.methods)
  Basejump.prototype[meth] = function(...args) { this.route(meth, ...args) }

module.exports = {Basejump, Router, Settings, Request, Plugins};
