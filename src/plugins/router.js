const RouteParser = require("route-parser");

const schemas = {
  settings: {
    type: "object",
    properties: {
      prefix: {type: "string"}
    }
  },
  collections: {
    route: {
      type: "object",
      properties: {
        method: {type: "string"},
        path: {type: "string"},
        settings: {$ref: "#/definitions/settings"}
      },
      required: ["method", "path", "settings"],
      additionalProperties: true,
      definitions: {
        param: {
          type: "object",
          properties: {
            in: {type: "string"},
            name: {type: "string"},
            type: {type: "string"},
            required: {type: "boolean"}
          },
          required: ["in", "name"],
          additionalProperties: true
        },
        settings: {
          type: "object",
          properties: {
            parameters: {items: {$ref: "#/definitions/param"}},
            action: {type: ["string", "object"]}
          },
          additionalProperties: true
        },
      }
    }
  }
};

class PluginRouter {
  static get name() { return "router" }
  static get schemas() { return schemas }

  static get collections() {
    return ["route"];
  }

  static get methods() {
    return ["get", "put", "post", "delete"];
  }

  constructor() {
    this.routes = new Map(this.constructor.methods.map(m => [m, new Map()]));
    this.prefix = null;
  }

  settings({prefix}) {
    if (prefix)
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
