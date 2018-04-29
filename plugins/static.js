const fs = require("fs");
const {join} = require("path");
const mime = require("mime");
const {Plugin} = require("..");

const route = action => ({settings: {action}});

const stat = path => new Promise(resolve =>
    fs.stat(path, (err, value) => resolve(err ? false : value)));

class Static {
  constructor(settings) {
    this[Plugin.settings](settings);
  }

  [Plugin.settings]({path, prefix, index = "index.html"} = {}) {
    this.index = index;
    this.path = path;
    this.prefix = prefix;
  }

  async [Plugin.route](request, next) {
    let {path} = request;

    if (!this.path) return next();

    if (this.prefix) {
      if (!target.startsWith(this.prefix)) return next();
      path = path.substring(this.prefix.length);
    }
    
    let target = join(this.path, path);
    let file = await stat(target);

    if (file && file.isDirectory()) {
      target = join(target, this.index);
      file = await stat(target);

      if (file && !path.endsWith("/"))
        return route(request => {
          let headers = {Location: `${this.prefix || ""}${target}/`};
          request.respond({code: 301, headers, body: null});
        });
    }

    if (!file.size) return next();

    return route(request => request.respond({
      body: fs.createReadStream(target),
      code: 200, headers: {
        "Content-Type": mime.getType(target),
        "Content-Length": file.size
      }
    }));
  }
}

module.exports = Static;
