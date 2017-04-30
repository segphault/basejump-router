
const fs = require("fs");
const {join} = require("path");
const mime = require("mime");

const stat = path =>
  new Promise(resolve =>
    fs.stat(path, (err, value) =>
      resolve(err ? false : value)));

class PluginStatic {
  static get name() { return "static" }

  constructor() {
    this.path = null;
    this.index = "index.html";
  }

  settings({path, index}) {
    this.path = path;
    this.index = index;
  }

  async route(method, target) {
    if (!this.path) return null;

    let path = join(this.path, target);
    let file = await stat(path);

    if (file && file.isDirectory()) {
      path = join(path, this.index);
      file = await stat(path);
    }

    if (!file.size) return null;

    let headers = {
      "Content-Type": mime.lookup(path),
      "Content-Length": file.size
    };

    let settings = {
      response(output, request) {
        return request.send(fs.createReadStream(path), headers);
      }
    };

    return {params: {}, route: {settings}};
  }
}

module.exports = PluginStatic;
