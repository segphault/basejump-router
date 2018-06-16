const vm = require("vm");
const path = require("path");
const http = require("http");
const Plugins = require(".");

const methods = {
  response: Symbol("response")
};

class Router {
  constructor(settings) {
    this.plugins = new Plugins();
    this.routes = new Map(http.METHODS.map(m => [m, new Map()]));
    this[Plugins.settings](settings);
  }

  pathToRegex(path) {
    let pattern = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                      .replace(/\\{([^}]+)\\}/g, "(?<$1>[^/]+)");

    return new RegExp(`^${pattern}$`);
  }

  add(method, path, settings) {
    this.routes.get(method.toUpperCase()).set(path, {
      method, path, settings,
      pattern: this.pathToRegex(path)
    });
  }

  remove(method, path) {
    this.routes.get(method).delete(path);
  }

  match(request) {
    let {path} = request;

    if (this.prefix) {
      if (!path.startsWith(this.prefix)) return;
      path = path.substring(this.prefix.length);
    }

    for (let route of this.routes.get(request.method).values()) {
      let match = route.pattern.exec(path);
      if (match)
        return {route, parameters: match.groups || {}}
    }
  }

  action(request, action) {
    if (typeof action === "string") {
      if (!this.context) this.context = vm.createContext({});
      return vm.runInContext(action, this.context)(request)
    }

    if (typeof action !== "function")
      throw new Error("Invalid action for endpoint");

    return action(request);
  }

  async response(request, output) {
    let handled = await this.plugins.middleware(methods.response, request, output);
    if (handled) return;

    let handler = typeof output === "string" ? "html" : "json";
    request[handler](output);
  }

  [Plugins.load](plugins) {
    this.plugins.load(plugins);
  }

  [Plugins.settings]({environment, prefix, routes = []} = {}) {
    this.prefix = prefix;

    if (environment) {
      if (typeof environment === "string")
        environment = require(path.resolve(environment))
      this.context = vm.createContext(environment);
    }

    for (let {method, path, settings} of routes)
      this.add(method, path, settings);
  }
 
  async [Plugins.request](request, next) {
    let match = this.match(request);
    if (!match) return next();

    request.router = match;
    await this.plugins.middleware(Plugins.request, request);
    
    let {action} = (match.route || {}).settings || {};
    if (!action) return true;

    let output = await this.action(request, action);
    if (output) this.response(request, output);

    return true;
  }
}

module.exports = Object.assign(Router, methods);