'use strict';

var yaml = require("yamljs");
var fs = require("fs");

module.exports = {
  load(fn, filetype) {
    let format = filetype ||
        fn.endsWith(".yaml") ? "yaml" :
        fn.endsWith(".json") ? "json" : null;

    let parser = {"yaml": yaml, "json": JSON}[format].parse;
    let data = parser(fs.readFileSync(fn, "utf8")).paths;

    let routes = [];
    for (var path of Object.keys(data))
      for (var method of Object.keys(data[path]))
        routes.push({path: path, method: method, settings: data[path][method]});

    return routes;
  }
}
