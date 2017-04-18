const RouteParser = require("route-parser");
const methods = ["get", "put", "post", "delete"];

class PluginRouter {
  static get name() { return "router" }
  
  constructor(settings) {
    this.routes = new Map(methods.map(m => [m, new Map()]));
  }
  
  setItem(route) {
    route.parsedRoute = new RouteParser(route.path);
    this.routes.get(route.method).set(route.path, route);
  }
  
  deleteItem(route) {
    this.routes.get(route.method).delete(route.path);
  }
  
  route(method, path) {
    for (let route of this.routes.get(method).values()) {
      let params = route.parsedRoute.match(path);
      if (params) return {params, route};
    }
  }
}

module.exports = PluginRouter;