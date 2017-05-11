const ajv = require("ajv");

const defaultPlugins = {
  Router: require("./plugins/router"),
  Schema: require("./plugins/schema"),
  Static: require("./plugins/static"),
  Realtime: require("./plugins/realtime")
};

class Plugins {
  constructor(plugins) {
    this.available = [];
    this.enabled = {};
    this.schemas = ajv();

    for (let plugin of plugins || [])
      this.add(plugin);
  }

  static get default() {
    return defaultPlugins;
  }

  get plugins() {
    return Object.values(this.enabled);
  }

  get environment() {
    return Object.assign(
      ...this.plugins.map(plugin => plugin.environment).filter(env => env));
  }

  get collections() {
    return this.available.filter(plugin => plugin.meta.collections).map(
      ({name, collections}) => ({name, collections}));
  }

  setItem(plugin, value, collection) {
    if (!this.enabled[plugin])
      throw `Can't apply settings to plugin that isn't enabled: ${plugin}`;
    this.enabled[plugin].setItem(value, collection);
  }

  deleteItem(plugin, value, collection) {
    if (!this.enabled[plugin])
      throw `Can't remove settings from plugin that isn't enabled: ${plugin}`;
    this.enabled[plugin].deleteItem(value, collection);
  }

  settings(plugin, settings) {
    if (!this.enabled[plugin])
      throw `Can't apply settings for plugin that isn't enabled: ${plugin}`;
    this.enabled[plugin].settings(settings);
  }

  add(plugin) {
    if (!plugin.meta)
      throw `Can't load ${plugin.name} because it has no metadata`;
    this.schema(plugin);
    this.available.push(plugin);
    this.enabled[plugin.meta.name] = new plugin(this);
  }

  remove(plugin) {
    delete this.enabled[plugin.meta.name];
  }

  async route({method, path}) {
    for (let plugin of this.plugins) {
      if (!plugin.route) continue;
      let match = await plugin.route(method, path);
      if (match) return match;
    }
  }

  request(...args) {
    for (let plugin of this.plugins)
      if (plugin.request) plugin.request(...args);
  }

  handler(type) {
    for (let plugin of this.plugins)
      if (plugin.handlers && plugin.handlers[type])
        return plugin.handlers[type];
  }

  responder(output) {
    for (let plugin of this.plugins)
      for (let responder of Object.values(plugin.responders || {}))
        if (responder.object.includes(output.constructor.name))
          return responder;
  }

  schema({name, schemas} = {}) {
    if (!schemas) return [];

    let {settings, collections} = schemas;
    let path = `plugins/${name}`;

    this.schemas.addSchema(settings, `${path}/settings`);
    this.schemas.addSchema(schema(path, collections), path);
    for (let [name, schema] of Object.entries(collections))
      this.schemas.addSchema(schema, `${path}/collections/${name}`);
  }

  configure(config) {
    for (let [plugin, {settings, collections}] of Object.entries(config)) {
      if (settings) this.settings(plugin, settings);
      if (!collections) continue;

      for (let [name, collection] of Object.entries(collections))
        for (let item of collection) this.setItem(plugin, item, name);
    }
  }
}

const schema = (path, collections) => ({
  type: "object",
  properties: {
    settings: {$ref: `${path}/settings`},
    collections: {
      type: "object",
      properties: Object.keys(collections).reduce((output, item) => {
        output[item] = {items: {$ref: `${path}/collections/${item}`}};
        return output;
      }, {})
    }
  }
});

module.exports = Plugins;
