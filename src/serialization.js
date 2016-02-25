'use strict';

var refParse = require("json-schema-ref-parser");

module.exports = {
  normalizePaths(paths) {
    let routes = [];
    for (var path of Object.keys(paths))
      for (var method of Object.keys(paths[path]))
        routes.push({path: path, method: method, settings: paths[path][method]});
    return routes;
  },

  normalizeDefinitions(defs) {
    let schemas = [];
    for (var def of Object.keys(defs))
      schemas.push(Object.assign({id: `#/definitions/${def}`}, defs[def]));
    return schemas;
  },

  normalizeTemplates(items) {
    let output = [];
    for (var i of Object.keys(items))
      output.push({name: i, routes: this.normalizePaths(items[i])});
    return output;
  },

  normalizeCollections(items) {
    let output = [];
    for (var c of Object.keys(items))
      output.push(Object.assign({name: c}, items[c],
        {routes: this.normalizePaths(items[c].routes || {})}));
    return output;
  },

  normalize(schema) {
    return Object.assign({}, schema, {
      template: this.normalizeTemplates(schema["x-templates"] || {}),
      collection: this.normalizeCollections(schema["x-collections"] || {}),
      schema: this.normalizeDefinitions(schema.definitions || {}),
      route: this.normalizePaths(schema.paths || {})
    });
  },

  load(fn) {
    return refParse.bundle(fn).then(schema => this.normalize(schema));
  }
};
