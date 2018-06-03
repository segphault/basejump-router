const vm = require("vm");
const path = require("path");
const http = require("http");
const Plugin = require(".");

const methods = {
  response: Symbol("response")
};

class Router extends Plugin {
  constructor(settings) {
    super();
    
    this.routes = new Map(http.METHODS.map(m => [m, new Map()]));
    this[Plugin.settings](settings);
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
    if (typeof action === "string" && this.context)
      return vm.runInContext(action, this.context)(request);

    if (typeof action !== "function")
      throw new Error("Invalid action for endpoint");

    return action(request);
  }

  async [methods.response](request, output) {
    if (await this[Plugin.middleware](methods.response, request, output)) return;

    let handler = typeof output === "string" ? "html" : "json";
    request[handler](output);
  }

  [Plugin.settings]({environment, prefix, routes = []} = {}) {
    this.prefix = prefix;

    if (environment) {
      if (typeof environment === "string")
        environment = require(path.resolve(environment))
      this.context = vm.createContext(environment);
    }

    for (let {method, path, settings} of routes)
      this.add(method, path, settings);
  }
 
  async [Plugin.request](request, next) {
    let match = this.match(request);
    if (!match) return next();

    request.router = match;
    await this[Plugin.middleware](Plugin.request, request);
    
    let {action} = (match.route || {}).settings || {};
    if (!action) return true;

    let output = await this.action(request, action);
    if (output) this[methods.response](request, output);

    return true;
  }
}

module.exports = Object.assign(Router, methods);