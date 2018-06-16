const Plugins = require(".");

class Params {
  convert(param, value) {
    return param.type === "number" ? Number(value) :
           param.type === "boolean" ? value === "true" : value;
  }

  [Plugins.request](request, next) {
    let {query, headers, router: {route, parameters: path = {}} = {}} = request;
    
    let {parameters} = route.settings || {};
    if (!parameters) return next();

    let input = {query, headers, path};
    request.parameters = {};

    for (let [name, param] of Object.entries(parameters)) {
      let value = input[param.in][param.name] || param.default;
      if (!value && param.required)
        throw `Missing parameter '${param.name}'`;

      request.parameters[name] = this.convert(param, value);
    }

    return next();
  }
}

module.exports = Params;