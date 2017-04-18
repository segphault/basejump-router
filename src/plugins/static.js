
const fs = require("fs");
const {join} = require("path");
const mime = require("mime");

const stat = path =>
  new Promise((resolve, reject) => 
    fs.stat(path, (err, value) =>
      resolve(err ? false : value)));

const settings = {
  path: null,
  indexFile: "index.html",
  apply({path}) {
    this.path = path;
  }
};

module.exports = {
  name: "static",
  settings,
  async route(method, target) {
    if (!settings.path) return null;
    
    let path = join(settings.path, target);
    let file = await stat(path);
    
    if (file && file.isDirectory()) {
      path = join(path, settings.indexFile);
      file = await stat(path);
    }
    
    if (!file.size) return null;
    
    let headers = {
      "Content-Type": mime.lookup(path),
      "Content-Length": file.size
    };
    
    let routeSettings = {
      response(output, request) {
        return request.send(fs.createReadStream(path), headers);
      }
    }
    
    return {params: {}, route: {settings: routeSettings}};
  }
};