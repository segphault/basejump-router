const ajv = require("ajv");
const {Plugin} = require("..");

class Schema {
  constructor(settings) {
    this.schemas = ajv();
    this[Plugin.settings](settings);
  }

  add(schema) {
    this.schemas.addSchema(schema);
  }

  remove(schema) {
    this.schemas.deleteSchema(schema);
  }

  [Plugin.settings]({schemas = []} = {}) {
    for (let schema of schemas)
      this.add(schema);
  }

  [Plugin.request](request, route, next) {
    let {schema} = route.settings || {};
    if (!schema) return next();

    if (!request.body)
      throw "Request body is missing";

    let check = this.schemas.validate(schema, request.body);
    if (!check) {
      let messages = this.schemas.errors.map(e => e.message).join("\n");
      throw `Invalid body: ${messages}`;
    }

    return next();
  }
}

module.exports = Schema;
