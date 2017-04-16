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

function process(schemaSetting, body) {
  let schema = (schemaSetting || {})["$ref"] || schemaSetting;
  let check = schema ? settings.schemas.validate(schema, body) : true;
  if (!check) throw `Invalid body: ${settings.schemas.errors[0].message}`;
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
