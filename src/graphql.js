const {buildSchema} = require("graphql");
const {many} = require("./utils");

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
