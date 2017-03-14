const vm = require("vm");
const ajv = require("ajv");
const jwt = require("jwt-simple");
const {graphql} = require("graphql");

const EventEmitter = require("events");
const RouteManager = require("./routes");
const CollectionManager = require("./collections");
const GraphQLManager = require("./graphql");

const sections = ["route", "blueprint", "collection", "schema", "graphql"];

class RequestHandler {
  constructor({config = {}, context, callback}) {
    this.schemas = ajv({removeAdditional: true});
    this.routes = new RouteManager();
    this.collections = new CollectionManager();
    this.graphql = new GraphQLManager();
    this.settings = config.settings;

    for (let section of sections)
      if (config[section]) this[`set${section}`](config[section])

    this.authConfig = config.settings.authentication;
    this.callback = callback || this.execute;
    this.context = typeof(context) === "function" ? context(this) : context;
  }

  convertParam(t, value) {
    return t === "number" ? Number(value) : value;
  }

  processBody(param, {body}) {
    let schema = (param.schema || {})["$ref"] || param.schema;
    let check = schema ? this.schemas.validate(schema, body) : true;
    if (!check) throw `Invalid parameter: ${this.schemas.errorsText()}`;
    return body;
  }

  processParam(param, input) {
    let value = input[param.in][param.name] || param.default;
    if (!value && param.required) throw `Missing parameter '${param.name}'`;
    return this.convertParam(param.type, value);
  }

  processParams(params, input) {
    if (!params) return {};
    let output = {};

    for (let p of params) {
      let param = Object.assign({}, p);

      if (param.schema === "@")
        param.schema = input.collection.schema;

      output[param.name] = param.in === "body" && param.schema ?
                           this.processBody(param, input) :
                           this.processParam(param, input);
    }

    return output;
  }

  processGraphQL(name, context) {
    let {schema, resolvers} = this.graphql.getSchema(name);
    let {query, variables} = context.params.body;
    let actions = {};

    for (let {id, action} of resolvers)
      actions[id] = params =>
        this.sandbox(action, Object.assign({}, context, {params}));

    return graphql(schema, query, actions, variables);
  }

  sandbox(code, context) {
    return vm.runInNewContext(code, context);
  }

  execute({action, graphql}, context) {
    if (graphql) return this.processGraphQL(graphql, context);
    if (action) return this.sandbox(action, context);
    throw "Route Action Not Implemented";
  }

  auth(access, token) {
    if (!this.authConfig) return null;
    let {secret} = this.authConfig.jwt;
    let user = token ? jwt.decode(token.replace("Bearer ", ""), secret) : null;

    if (!access) return user;
    if (access.require && (!user || !user.access || !user.access.includes(access.require)))
      throw {error: 401, message: "Unauthorized", expose: true};

    return user;
  }

  match(method, path) {
    return this.routes.findMatch(method, path) ||
           this.collections.findMatch(method, path);
  }

  handle(req, route) {
    let match = route || this.match(req.method, req.path);
    if (!match) return;

    req.params = req.params || {};
    req.params.path = match.params;
    req.params.collection = match.collection;

    let context = Object.assign({}, this.context, {
      collection: (match.collection || {}).name,
      params: this.processParams(match.route.parameters, req.params),
      user: this.auth(match.route.access, req.params.header.authorization),
      EventEmitter: EventEmitter, Promise: Promise
    });

    return Promise.resolve(this.callback(match.route, context));
  }

  setroute(x) { this.routes.setRoute(x); }
  deleteroute(x) { this.routes.deleteRoute(x); }
  setcollection(x) { this.collections.setCollection(x); }
  deletecollection(x) { this.collections.deleteCollection(x); }
  setblueprint(x) { this.collections.setBlueprint(x); }
  deleteblueprint(x) { this.collections.deleteBlueprint(x); }
  setschema(x) { this.schemas.addSchema(x); }
  deleteschema(x) { this.schemas.deleteSchema(x); }
  setgraphql(x) { this.graphql.setSchema(x); }
  deletegraphql(x) { this.graphql.deleteSchema(x); }
}

module.exports = RequestHandler;
