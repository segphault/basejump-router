
const fs = require("fs");
const {join} = require("path");
const mime = require("mime");

const stat = path =>
  new Promise(resolve =>
    fs.stat(path, (err, value) =>
      resolve(err ? false : value)));

const route = response =>
  ({params: {}, route: {settings: {response}}});

const schemas = {
  settings: {
    type: "object",
    properties: {
      prefix: {type: "string"},
      path: {type: "string"},
      index: {type: "string"},
    }
  }
};

const meta = {
  name: "static",
  displayName: "Static Files",
  description: "Serve static files",
  configurable: true,
  schemas
}

class PluginStatic {
  static get meta() { return meta; }

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

      if (file && !target.endsWith("/"))
        return route((output, request) => {
          let location = `${this.prefix || ""}${target}/`;
          request.response.writeHead(301, {Location: location});
          request.response.end();
        });
    }

    if (!file.size) return null;

    return route((output, request) =>
      request.send(fs.createReadStream(path), {
        "Content-Type": mime.lookup(path),
        "Content-Length": file.size
      }));
  }
}

module.exports = PluginStatic;
