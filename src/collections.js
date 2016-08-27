const RouteManager = require("./routes");

let many = items => items.constructor === Array ? items : [items];

class CollectionManager {
  constructor(collections, templates) {
    this.collections = new Map();
    this.templates = new Map();
  }

  setTemplate(templates) {
    for (let template of many(templates))
      this.templates.set(template.name, template);
  }

  setCollection(collections) {
    for (let collection of many(collections)) {
      this.collections.set(collection.name, collection);
      let template = this.templates.get(collection.template);

      let routes =
        [].concat(collection.routes, template.routes)
        .map(route => Object.assign({}, route,
              {path: `${collection.path}${route.path}`.replace(/\/$/, "")}));

      collection.routes = new RouteManager(routes);
    }
  }

  deleteTemplate(template) {
    this.templates.delete(template.name);
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
