
const {METHODS} = require("http");
const {Plugin} = require("..");

class Router {
  constructor(settings) {
    this.routes = new Map(METHODS.map(m => [m, new Map()]));
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

  [Plugin.settings]({prefix, routes} = {}) {
    this.prefix = prefix;
    
    for (let {method, path, settings} of routes || [])
      this.add(method, path, settings);
  }

  [Plugin.route](request, next) {
    let {path} = request;

    if (this.prefix) {
      if (!path.startsWith(this.prefix)) return next();
      path = path.substring(this.prefix.length);
    }

    for (let route of this.routes.get(request.method).values()) {
      let match = route.pattern.exec(path);
      if (!match) continue;

      request.router = {parameters: match.groups || {}, route}
      return route;
    }

    return next();
  }

  [Plugin.response](request, route, output, next) {
    request[typeof output === "string" ? "html" : "json"](output);
  }
}

module.exports = Router;