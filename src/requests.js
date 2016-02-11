'use strict';

var vm = require("vm");
var ajv = require("ajv");
var bluebird = require("bluebird");

var RouteManager = require("./routes");
var serialization = require("./serialization");

class RequestHandler extends RouteManager {
  constructor(opts) {
    opts = opts || {};
    super();

    this.schemas = ajv();

    if (opts.routes)
      this.setRoutes(opts.routes);

    if (opts.swagger)
      serialization.load(opts.swagger).then(schema => {
        this.setRoutes(schema.paths);
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

  checkParamType(t, value) {
    return t === "array" ? value instanceof Array : typeof(value) === t;
  }

  processParams(params, input) {
    if (!params) return {};

    let output = {};

    for (let param of params) {
      let value = input[param.in][param.name] || param.default;

      if (!value && param.required)
        throw {name: "ParamMissing", expose: true, error: 400,
               message: `Missing parameter '${param.name}'`};

      if (param.in === "body" && !this.checkParamType(param.type, value))
        throw {name: "ParamWrongType", expose: true, error: 400,
               message: `Parameter '${param.name}' should be ${param.type}`};

      if (param.schema) {
        let schema = param.schema["$ref"] || param.schema;
        let check = this.schemas.validate(schema, value);

        if (!check)
          throw {name: "ParamInvalid", expose: true, error: 400,
                 message: `Invalid parameter: ${this.schemas.errorsText()}`};
      }

      output[param.name] = this.convertParam(param.type, value);
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
    let output = this.callback(match.route, params);

    return bluebird.resolve(output);
  }
}

module.exports = RequestHandler;
