const {buildSchema} = require("graphql");

let many = items => items.constructor === Array ? items : [items];

class GraphQLManager {
  constructor() {
    this.schemas = new Map();
  }

  getSchema(name) {
    return this.schemas.get(name);
  }

  setSchema(schemas) {
    for (let {id, schema, resolvers} of many(schemas))
      this.schemas.set(id, {id, resolvers, schema: buildSchema(schema)});
  }

  deleteSchema(id) {
    this.schemas.delete(id);
  }
}

module.exports = GraphQLManager;
