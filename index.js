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
  constructor({plugins = [], config, environment, router} = {}) {
    super();

    let plugs = [...Object.values(Plugins), ...plugins];
    this.router = router ? router :
                  new Router(new Settings(plugs, config), environment);
  }

  async request(req, res, next) {
    let request = new Request(req, res);

    try {
      let match = await this.router.settings.findRoute(request);
      if (!match) return next ? next() : request.error("Not Found", 404);
      if (!match.route) throw {message: "Invalid Route", match, request};

      request.params.path = match.params;
      request.route = match.route;

      if (["put", "post"].includes(request.method)) await request.parse();

      this.emit("request", request);
      this.router.respond(await this.router.handle(request), request);
    }
    catch (err) {
      request.error(err);
      this.emit("failure", err);
    }
  }

  route(method, path, settings) {
    this.settings.setItem("router", {method, path, settings}, "routes");
  }

  listen(...args) {
    return createServer(this.request.bind(this)).listen(...args);
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
