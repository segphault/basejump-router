'use strict';

var vm = require("vm");
var ajv = require("ajv");
var bluebird = require("bluebird");

var RouteManager = require("./routes");
var CollectionManager = require("./collections");
var serialization = require("./serialization");

const sections = ["route", "template", "collection", "schema"];

class RequestHandler {
  constructor(opts) {
    opts = opts || {};

    this.schemas = ajv({removeAdditional: true});
    this.routes = new RouteManager();
    this.collections = new CollectionManager();

    if (opts.routes)
      this.routes.setRoute(opts.routes);

    if (opts.swagger)
      serialization.load(opts.swagger).then(schema => {
        for (let section of sections)
          this[`set${section}`](schema[section]);
      })
      .catch(err => {
        console.log("Failed to parse Swagger schema:\n", err.stack);
      });

    this.actionField = opts.actionField || "x-action";
    this.callback = opts.callback || this.execute;
    if (opts.context) this.context = opts.context;
  }

  convertParam(t, value) {
    return t === "number" ? Number(value) : value;
  }

  processBody(param, input) {
    let schema = (param.schema || {})["$ref"] || param.schema || "#/definitions/default";
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

    for (let p of params) {
      let param = Object.assign({}, p);

      if (param.schema === "@")
        param.schema = input.collection.schema;

      output[param.name] = param.in === "body" ?
                           this.processBody(param, input) :
                           this.processParam(param, input);
    }

    return output;
  }

  sandbox(code, context) {
    return vm.runInNewContext(code, context);
  }

  execute(route, context) {
    return route[this.actionField] ?
           this.sandbox(route[this.actionField], context) :
           "Route Action Not Implemented";
  }

  handle(req) {
    let match = this.routes.findMatch(req.method, req.path) ||
                this.collections.findMatch(req.method, req.path);

    if (!match) return null;

    req.params = req.params || {};
    req.params.path = match.params;
    req.params.collection = match.collection;

    let context = Object.assign({}, this.context, {
      collection: (match.collection || {}).name,
      params: this.processParams(match.route.parameters, req.params)
    });

    return bluebird.resolve(this.callback(match.route, context));
  }

  setroute(x) { this.routes.setRoute(x); }
  deleteroute(x) { this.routes.deleteRoute(x); }
  setcollection(x) { this.collections.setCollection(x); }
  deletecollection(x) { this.collections.setCollection(x); }
  settemplate(x) { this.collections.setTemplate(x); }
  deletetemplate(x) { this.collections.deleteTemplate(x); }
  setschema(x) { this.schemas.addSchema(x); }
  deleteschema(x) { this.schemas.deleteSchema(x); }
}

module.exports = RequestHandler;
