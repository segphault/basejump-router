const vm = require("vm");
const RouteParser = require("route-parser");
const methods = ["get", "put", "post", "delete"];

const settings = {
  routes: new Map(methods.map(m => [m, new Map()])),
  setItem(route) {
    route.parsedRoute = new RouteParser(route.path);
    this.routes.get(route.method).set(route.path, route);
  },
  deleteItem(route) {
    this.routes.get(route.method).delete(route.path);
  }
};

module.exports = {
  name: "router",
  settings,
  responders: {
    html: {
      content: "text/html", object: ["String"],
      responder(output, request) {
        request.send(output, {"Content-Type": this.content});
      }
    },
    json: {
      content: "application/json", object: ["Object", "Array"],
      responder(output, request) {
        request.send(JSON.stringify(output), {"Content-Type": this.content});
      }
    },
  },
  route(method, path) {
    for (let route of settings.routes.get(method).values()) {
      let params = route.parsedRoute.match(path);
      if (params) return {params, route};
    }
  }
};
