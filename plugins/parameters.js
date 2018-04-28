const {Plugin} = require("..");

class Params {
  convert(param, value) {
    return type === "number" ? Number(value) :
           type === "boolean" ? value === "true" : value;
  }

  [Plugin.request](request, route, next) {
    let {parameters} = route.settings || {};
    if (!parameters) return next();

    let input = {
      query: request.query,
      headers: request.headers,
      path: (request.router || {}).parameters || {}
    };

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