const {createContext, runInContext} = require("vm");
const {createServer} = require("http");
const {EventEmitter} = require("events");

const Settings = require("./settings");
const Request = require("./request");
const Plugin = require("./plugins");

class Basejump extends EventEmitter {
  constructor(settings = {plugins: [], environment: {}}) {
    super();
    this.settings = settings;
  }

  middleware(feature, ...args) {
    let {plugins = []} = this.settings || {};
    let filtered = plugins.filter(plugin => plugin[feature]);

    let run = n =>
      filtered[n] &&
      filtered[n][feature](...args, () => run(n + 1));

    return run(0);
  }

  async route(request) {
    let {plugins = []} = this.settings || {};

    for (let plugin of plugins) {
      if (!plugin[Plugin.route]) continue;
      
      let route = await plugin[Plugin.route](request);
      if (route) return route;
    }
  }

  async action(request, route) {
    let {context} = this.settings || {};
    let {action} = route.settings || {};

    if (typeof action === "string" && context)
      return runInContext(action, context)(request);

    if (typeof action !== "function")
      throw new Error("Invalid action for endpoint");

    return action(request);
  }

  output(request, output, code=200) {
    if (!output) return;

    if (output[Symbol.asyncIterator])
      request.events(output);
    else request[typeof output === "string" ? "html" : "json"](output, code);
  }

  error(request, error) {
    if (typeof error === "string")
      return request.json({error}, 400);

    if (!error.expose)
      return request.json({error: "Server Error"}, 500);

    request.json({error: error.message}, error.code);
  }

  async request(request, next) {
    try {
      let route = await this.route(request);
      this.emit("request", request);

      if (!route)
        return next ? next() :
        this.error(request, {message: "Not Found", code: 404, expose: true});

      await this.middleware(Plugin.request, request, route);
      let output = await this.action(request, route);
      this.output(request, output);
    }
    catch (err) {
      this.error(request, err);
      this.emit("failure", err);
    }
  }

  attach(req, res, next) {
    this.request(new Request(req, res), next);
  }

  listen(...args) {
    return createServer(this.attach.bind(this)).listen(...args);
  }
}

module.exports = {Basejump, Request, Settings, Plugin};
