'use strict';

var RouteParser = require("route-parser");
var serialization = require("./serialization");

class RouteManager {
  constructor(routes) {
    let methods = ["get", "put", "post", "delete"];
    this.routes = new Map(methods.map(m => [m, new Map()]));
    if (routes) this.setRoutes(routes);
  }

  loadRoutes(fn) {
    this.setRoutes(serialization.load(fn));
  }

  setRoutes(routes) {
    routes.forEach(r => this.setRoute(r));
  }

  setRoute(route) {
    route.parsedRoute = new RouteParser(route.path);
    this.routes.get(route.method).set(route.path, route);
  }

  deleteRoute(route) {
    this.routes.get(route.method).delete(route.path);
  }

  findMatch(method, path) {
    for (let route of this.routes.get(method).values()) {
      let pathParams = route.parsedRoute.match(path);

      if (pathParams)
        return {params: pathParams, route: route.settings}
    }
  }
}

module.exports = RouteManager;
