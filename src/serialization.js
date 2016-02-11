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

  normalizeDefs(defs) {
    let schemas = [];
    for (var def of Object.keys(defs))
      schemas.push(Object.assign({}, {id: `#/definitions/${def}`}, defs[def]));
    return schemas;
  },

  normalize(schema) {
    return Object.assign({}, schema, {
      definitions: this.normalizeDefs(schema.definitions),
      paths: this.normalizePaths(schema.paths)
    });
  },

  load(fn) {
    return refParse.bundle(fn).then(schema => this.normalize(schema));
  }
}
