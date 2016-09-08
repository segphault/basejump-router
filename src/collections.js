const RouteManager = require("./routes");

let many = items => items.constructor === Array ? items : [items];

class CollectionManager {
  constructor(collections, blueprints) {
    this.collections = new Map();
    this.blueprints = new Map();
  }

  setBlueprint(blueprints) {
    for (let blueprint of many(blueprints))
      this.blueprints.set(blueprint.name, blueprint);
  }

  setCollection(collections) {
    for (let collection of many(collections)) {
      this.collections.set(collection.name, collection);
      let blueprint = this.blueprints.get(collection.blueprint);

      let routes =
        [].concat(collection.routes, blueprint.routes)
        .map(route => Object.assign({}, route,
              {path: `${collection.path}${route.path}`.replace(/\/$/, "")}));

      collection.routes = new RouteManager(routes);
    }
  }

  deleteBlueprint(blueprint) {
    this.blueprints.delete(blueprint.name);
  }

  deleteCollection(collection) {
    this.collections.delete(collection.name);
  }

  findMatch(method, path) {
    for (let collection of this.collections.values()) {
      let match = collection.routes.findMatch(method, path);
      if (match) return Object.assign({collection: collection}, match);
    }
  }
}

module.exports = CollectionManager;
