const ajv = require("ajv");

const settings = {
  schemas: ajv({removeAdditional: true}),
  setItem(schema) {
    this.schemas.addSchema(schema);
  },
  deleteItem(schema) {
    this.schemas.deleteSchema(schema);
  }
};

function errors() {
  let messages = settings.schemas.errors.map(e => e.message).join("\n");
  return {expose: true, error: 400, message: `Invalid body: ${messages}`};
}

function process(schemaSetting, body) {
  let schema = (schemaSetting || {})["$ref"] || schemaSetting;
  let check = schema ? settings.schemas.validate(schema, body) : true;
  if (!check) throw errors();
  return body;
}

module.exports = {
  name: "schema",
  settings,
  params({route, params}, outputParams) {
    if (!route.settings.schema) return;
    Object.assign(outputParams, process(route.settings.schema, params.body));
  }
};
