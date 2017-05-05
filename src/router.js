const {createContext, runInContext} = require("vm");

class Router {
  constructor(plugins, environment = {}) {
    this.plugins = plugins;
    this.environment = environment;
  }

  set environment(env) {
    this.context = createContext(Object.assign({}, this.plugins.environment, env));
  }

  params(params, input) {
    if (!params) return {};
    let output = {};

    for (let param of params) {
      let value = input[param.in][param.name] || param.default;
      if (!value && param.required)
        throw `Missing parameter '${param.name}'`;

      output[param.name] = param.type === "number" ? Number(value) : value;
    }

    return output;
  }

  async route(request) {
    let match = await this.plugins.route(request);
    if (!match) return;

    if (!match.route)
      throw new Error("Invalid Route");

    request.params.path = match.params;
    return match.route;
  }

  handle(request) {
    let {action, parameters} = request.route.settings || {};
    if (!action) return;

    let params = this.params(parameters, request.params);
    this.plugins.request(request, params);

    if (typeof action === "function")
      return action(params, request);

    if (typeof action === "string")
      return runInContext(action, this.context)(params, request);

    let handler = this.plugins.handler(action.type);
    if (handler) return handler(request.route, this.context, params);

    throw new Error("Could not find a handler for route");
  }

  respond(output, request) {
    let {response} = request.route.settings || {};
    if (response) return response(output, request);

    if (!output)
      return request.send("", "text/html");

    if (typeof output === "string")
      return request.send(output, "text/html");

    if (["Object", "Array"].includes(output.constructor.name))
      return request.json(output);

    let responder = this.plugins.responder(output);
    if (!responder)
      throw new Error(`Couldn't find responder for type: ${output.constructor.name}`);

    return responder.responder(output, request);
  }
}

module.exports = Router;
