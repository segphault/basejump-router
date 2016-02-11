'use strict';

var vm = require("vm");
var ajv = require("ajv");
var bluebird = require("bluebird");

var RouteManager = require("./routes");
var serialization = require("./serialization");

class RequestHandler {
  constructor(opts) {
    opts = opts || {};

    this.schemas = ajv({removeAdditional: true});
    this.routes = new RouteManager();

    if (opts.routes)
      this.routes.setRoute(opts.routes);

    if (opts.swagger)
      serialization.load(opts.swagger).then(schema => {
        this.routes.setRoute(schema.paths);
        this.schemas.addSchema(schema.definitions);
      })
      .catch(err => {
        console.log("Failed to parse Swagger schema:", err);
      });

    this.actionField = opts.actionField || "x-action";
    this.callback = opts.callback || this.execute;
    if (opts.context) this.context = opts.context;
  }

  convertParam(t, value) {
    return t === "number" ? Number(value) : value;
  }

  processBody(param, input) {
    let schema = param.schema["$ref"] || param.schema;
    let check = this.schemas.validate(schema, input.body);

    if (!check)
      throw {name: "ParamInvalid", expose: true, error: 400,
             message: `Invalid parameter: ${this.schemas.errorsText()}`};

    return input.body;
  }

  processParam(param, input) {
    let value = input[param.in][param.name] || param.default;

    if (!value && param.required)
      throw {name: "ParamMissing", expose: true, error: 400,
             message: `Missing parameter '${param.name}'`};

    return this.convertParam(param.type, value);
  }

  processParams(params, input) {
    if (!params) return {};
    let output = {};

    for (let param of params)
      output[param.name] = param.in === "body" ?
                           this.processBody(param, input) :
                           this.processParam(param, input);
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
    let match = this.routes.findMatch(req.method, req.path);
    if (!match) return null;

    req.params.path = match.params;

    let params = this.processParams(match.route.parameters, req.params);
    let output = this.callback(match.route, params);

    return bluebird.resolve(output);
  }
}

module.exports = RequestHandler;
