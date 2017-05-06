const ajv = require("ajv");

class PluginSchema {
  static get name() { return "schema" }

  static get collections() {
    return ["schemas"];
  }

  constructor() {
    this.schemas = ajv();
  }

  setItem(schema) {
    this.schemas.addSchema(schema);
  }

  deleteItem(schema) {
    this.schemas.deleteSchema(schema);
  }

  request({route, params}, outputParams) {
    if (!route.settings.schema) return;

    let check = this.schemas.validate(route.settings.schema, params.body);

    if (!check) {
      let messages = this.schemas.errors.map(e => e.message).join("\n");
      throw `Invalid body: ${messages}`;
    }

    return Object.assign(outputParams, params.body);
  }
}

module.exports = PluginSchema;
