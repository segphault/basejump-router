const RouteParser = require("route-parser");

let many = items => items.constructor === Array ? items : [items];

class RouteManager {
  constructor(routes) {
    let methods = ["get", "put", "post", "delete"];
    this.routes = new Map(methods.map(m => [m, new Map()]));
    if (routes) this.setRoute(routes);
  }

  setRoute(routes) {
    for (var route of many(routes)) {
      route.parsedRoute = new RouteParser(route.path);
      this.routes.get(route.method).set(route.path, route);
    }
  }

  deleteRoute(route) {
    this.routes.get(route.method).delete(route.path);
  }

  findMatch(method, path) {
    for (let route of this.routes.get(method).values()) {
      let pathParams = route.parsedRoute.match(path);

      if (pathParams)
        return {params: pathParams, route: route.settings};
    }
  }
}

module.exports = RouteManager;
