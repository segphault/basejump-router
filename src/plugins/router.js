const RouteParser = require("route-parser");

class PluginRouter {
  static get name() { return "router" }

  static get methods() {
    return ["get", "put", "post", "delete"];
  }

  constructor() {
    this.routes = new Map(this.constructor.methods.map(m => [m, new Map()]));
    this.prefix = null;
  }

  settings({prefix}) {
    this.prefix = prefix;
  }

  setItem(route) {
    route.parsedRoute = new RouteParser(route.path);
    this.routes.get(route.method).set(route.path, route);
  }

  deleteItem(route) {
    this.routes.get(route.method).delete(route.path);
  }

  route(method, path) {
    if (this.prefix) {
      if (!path.startsWith(this.prefix)) return;
      path = path.substring(this.prefix.length);
    }

    for (let route of this.routes.get(method).values()) {
      let params = route.parsedRoute.match(path);
      if (params) return {params, route};
    }
  }
}

module.exports = PluginRouter;
