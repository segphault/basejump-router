
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
    this.index = "index.html";
    this.prefix = null;
    this.path = null;
  }

  settings({path, index, prefix}) {
    if (index) this.index = index;
    if (prefix) this.prefix = prefix;
    if (path) this.path = path;
  }

  async route(method, target) {
    if (!this.path) return;

    if (this.prefix) {
      if (!target.startsWith(this.prefix)) return;
      target = target.substring(this.prefix.length);
    }

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
