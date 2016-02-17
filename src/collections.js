'use strict';

var RouteManager = require("./routes");

class CollectionManager {
  constructor(collections, templates) {
    this.collections = new Map();
    this.templates = new Map();
  }

  many(items) {
    return items.constructor === Array ? items : [items];
  }

  setTemplate(templates) {
    for (let template of this.many(templates))
      this.templates.set(`#/x-templates/${template.name}`, template);
  }

  setCollection(collections) {
    for (let collection of this.many(collections)) {
      this.collections.set(collection.name, collection);

      let template = collection.template["$ref"] ?
                     this.templates.get(collection.template["$ref"]) :
                     collection.template;

      let routes = [].concat(collection.routes, template.routes);

      for (let route of routes)
        route.path = `${collection.path}${route.path}`.replace(/\/$/, "");

      collection.routes = new RouteManager(routes);
    }
  }

  deleteTemplate(template) {
    this.templates.delete(`#/x-templates/${template.name}`);
  }

  deleteCollection(collection) {
    this.collections.delete(collection.name);
  }

  findMatch(method, path) {
    for (let collection of this.collections.values()) {
      let match = collection.routes.findMatch(method, path);
      if (match) return Object.assign({collection: collection.name}, match);
    }
  }
}

module.exports = CollectionManager;
