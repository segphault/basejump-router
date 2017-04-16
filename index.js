const {EventEmitter} = require("events");
const {createContext, runInContext} = require("vm");

const Settings = require("./src/settings");
const Request = require("./src/request");

class Router extends EventEmitter {
  constructor(environment, config, plugins, responders) {
    super();
    
    this.settings = new Settings(plugins, config);
    this.environment = Object.assign({}, this.settings.environment(), environment);
    this.context = createContext(this.environment);
  }
  
  add(method, path, settings) {
    this.settings.setItem("router", {method, path, settings}, "routes");
  }
  
  convertParam(t, value) {
    return t === "number" ? Number(value) : value;
  }

  processParam(param, input) {
    let value = input[param.in][param.name] || param.default;
    if (!value && param.required) throw `Missing parameter '${param.name}'`;
    return this.convertParam(param.type, value);
  }

  processParams(params, input) {
    if (!params) return {};
    let output = {};

    for (let p of params)
      output[p.name] = this.processParam(p, input);

    return output;
  }
  
  handle(request) {
    let {action, parameters} = request.route.settings;
    
    if (!action)
      throw "Could not find an action for route";
    
    let params = this.processParams(parameters, request.params);
    for (let paramFunc of this.settings.params())
      paramFunc(request, params);
    
    if (typeof action === "function") return action(params);
    if (typeof action === "string") return runInContext(action, this.context)(params);
    
    let handler = this.settings.findHandler(action.type);
    if (handler) return handler(request.route, this.context, params);
    
    throw "Could not find a handler for route";
  }
  
  async request(req, res, next) {
    let request = new Request(req, res);
    
    try {
      let match = await this.settings.findRoute(request);
      if (!match) return next ? next() : request.error(404, "Not Found");
      
      request.params.path = match.params;
      request.route = match.route;
      
      if (["put", "post"].includes(request.method))
        await request.parse();
      
      this.emit("request", request);
      
      let output = await this.handle(request);
      let responder = this.settings.findResponder(output);
      
      if (!responder)
        throw `Couldn't find responder for type: ${output.constructor.name}`
      
      responder.responder(output, request);
    }
    catch (err) {
      request.error(err);
      this.emit("failure", err);
    }
  }
}

const plugins = {
  router: require("./src/plugins/router"),
  schema: require("./src/plugins/schema")
};

module.exports = {Router, Settings, Request, plugins};
