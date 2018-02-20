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

const meta = {
  name: "router",
  displayName: "Router",
  description: "Define server endpoints",
  collections: ["route"],
  configurable: true,
  schemas
}

class PluginRouter {
  static get meta() { return meta; }

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
    let pattern = route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                            .replace(/\\{([^}]+)\\}/g, "(?<$1>.+)");

    let parsed = new RegExp(`^${pattern}$`);
    this.routes.get(route.method).set(route.path, {route, parsed});
  }

  deleteItem(route) {
    this.routes.get(route.method).delete(route.path);
  }

  route(method, path) {
    if (this.prefix) {
      if (!path.startsWith(this.prefix)) return;
      path = path.substring(this.prefix.length);
    }

    for (let {route, parsed} of this.routes.get(method).values()) {
      let match = parsed.exec(path);
      if (match)
        return {params: match.groups || {}, route};
    }
  }
}

module.exports = PluginRouter;
