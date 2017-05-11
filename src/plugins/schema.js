const ajv = require("ajv");

const meta = {
  name: "schema",
  displayName: "JSON Schema",
  description: "Validate request bodies with JSON Schema",
  collections: ["schema"],
  configurable: true
};

class PluginSchema {
  static get meta() { return meta }

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
