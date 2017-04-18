const ajv = require("ajv");

class PluginSchema {
  static get name() { return "schema" }
  
  constructor(settings) {
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
    
    let schema = route.settings.schema["$ref"] || route.settings.schema;
    let check = schema ? this.schemas.validate(schema, params.body) : true;
    
    if (!check) {
      let messages = this.schemas.errors.map(e => e.message).join("\n");
      throw {expose: true, error: 400, message: `Invalid body: ${messages}`};
    }
    
    return Object.assign(outputParams, params.body);
  }
}

module.exports = PluginSchema;