'use strict';

var vm = require("vm");
var bluebird = require("bluebird");
var RouteManager = require("./routes");

class RequestHandler extends RouteManager {
  constructor(opts) {
    opts = opts || {};
    super();

    if (opts.routes)
      if (typeof(opts.routes) === "string")
        this.loadRoutes(opts.routes)
      else this.setRoutes(opts.routes);

    this.actionField = opts.actionField || "x-action";
    if (opts.callback) this.execute = opts.callback;
    if (opts.context) this.context = opts.context;
  }

  convertParam(t, value) {
    return t === "number" ? Number(value) : value;
  }

  checkParamType(t, value) {
    return t === "array" ? value instanceof Array : typeof(value) === t;
  }

  processParams(params, input) {
    if (!params) return {};

    let output = {};

    for (let param of params) {
      let value = input[param.in][param.name] || param.default;

      if (!value && param.required)
        throw `Missing parameter '${param.name}'`;

      if (param.in === "body" && !this.checkParamType(param, value))
        throw `Parameter '${param.name}' should have type ${param.type}`;

      output[param.name] = this.convertParam(param, value);
    }

    return output;
  }

  sandbox(code, params) {
    let sandbox = Object.assign(this.context || {}, {params: params});
    return vm.runInNewContext(code, sandbox);
  }

  execute(route, params) {
    return route[this.actionField] ?
           this.sandbox(route[this.actionField], params) :
           "Route Action Not Implemented";
  }

  handle(req) {
    let match = this.findMatch(req.method, req.path);
    if (!match) return null;

    req.params.path = match.params;

    let params = this.processParams(match.route.parameters, req.params);
    let output = this.execute(match.route, params);

    return bluebird.resolve(output);
  }
}

module.exports = RequestHandler;
