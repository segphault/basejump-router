const Plugins = require(".");

const errLength = "Must specify content length";
const errSize = "Body must not exceed size limit";

const methods = {
  validate: Symbol("validate")
}

class Body {
  constructor(settings) {
    this.plugins = new Plugins();
    this[Plugins.settings](settings);
  }

  [Plugins.load](plugins) {
    this.plugins.load(plugins);
  }

  [Plugins.settings]({limit = 1000000} = {}) {
    this.limit = limit;
  }

  async [Plugins.request](request, next) {
    let typeHeader = request.headers["content-type"];
    if (!typeHeader || request.body) return next();

    let contentType = typeHeader.split(";")[0].trim();
    if (contentType !== "application/json") return next();

    // TODO Optional 415 error handling

    let contentLength = request.headers["content-length"];
    if (!contentLength)
      throw {code: 411, expose: true, message: errLength};

    if (Number(contentLength) > this.limit)
      throw {code: 413, expose: true, message: errSize};

    let body = "";
    for await (let chunk of request) body += chunk;

    request.body = JSON.parse(body);
    await this.plugins.middleware(methods.validate, request);

    return next();
  }
}

module.exports = Object.assign(Body, methods);