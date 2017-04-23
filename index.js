const {createServer} = require("http");
const {EventEmitter} = require("events");

const Settings = require("./src/settings");
const Request = require("./src/request");
const Router = require("./src/router");

const defaultPlugins = {
  router: require("./src/plugins/router"),
  schema: require("./src/plugins/schema"),
  static: require("./src/plugins/static"),
  realtime: require("./src/plugins/realtime")
};

class Basejump extends EventEmitter {
  constructor({plugins, config, environment, router} = {}) {
    super();

    this.router = router ? router :
      new Router(new Settings(plugins ||
        Object.values(defaultPlugins), config), environment);
  }

  async request(req, res, next) {
    let request = new Request(req, res);

    try {
      let match = await this.router.settings.findRoute(request);
      if (!match) return next ? next() : request.error("Not Found", 404);

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

  addRoute(method, path, settings) {
    this.router.settings.setItem("router", {method, path, settings}, "routes");
  }

  get(...args) { this.addRoute("get", ...args) }
  put(...args) { this.addRoute("put", ...args) }
  post(...args) { this.addRoute("post", ...args) }
  delete(...args) { this.addRoute("delete", ...args) }

  listen(...args) {
    return createServer(this.request.bind(this)).listen(...args);
  }

  get middleware() {
    return this.request.bind(this);
  }

  static get plugins() {
    return defaultPlugins;
  }
}

module.exports = {Basejump, Router, Settings, Request};
