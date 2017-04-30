const events = require("events");

class Settings {
  constructor(plugins, config) {
    this.events = new events.EventEmitter();
    this.plugins = {};

    for (let plugin of plugins)
      this.plugins[plugin.name] = new plugin(this);

    if (config)
      this.load(config);
  }

  setItem(plugin, value, collection, suppressNotify) {
    if (!this.plugins[plugin])
      throw `Can't apply settings to plugin that isn't present: ${plugin}`;

    this.plugins[plugin].setItem(value, collection);

    if (!suppressNotify)
      this.events.emit("set", {plugin, collection, value});
  }

  deleteItem(plugin, value, collection, suppressNotify) {
    if (!this.plugins[plugin])
      throw `Can't remove settings from plugin that isn't present: ${plugin}`;

    this.plugins[plugin].deleteItem(value, collection);

    if (!suppressNotify)
      this.events.emit("delete", {plugin, collection, value});
  }

  applySettings(plugin, settings) {
    let plug = this.plugins[plugin];

    if (!plug)
      throw `Can't apply settings for plugin that isn't present: ${plugin}`;

    if (plug.settings)
      plug.settings(settings);
  }

  loadItems(plugin, collections) {
    for (let [name, collection] of Object.entries(collections))
      for (let item of collection)
        this.setItem(plugin, item, name);
  }

  load(config) {
    for (let [plugin, {settings, collections}] of Object.entries(config)) {
      if (!this.plugins[plugin])
        throw `Can't load settings for plugin that isn't present: ${plugin}`;

      if (settings) this.applySettings(plugin, settings);
      if (collections) this.loadItems(plugin, collections);
    }
  }

  async findRoute({method, path}) {
    for (let plugin of Object.values(this.plugins)) {
      if (plugin.route) {
        let match = await plugin.route(method, path);
        if (match) return match;
      }
    }
  }

  findHandler(type) {
    for (let plugin of Object.values(this.plugins))
      if (plugin.handlers && plugin.handlers[type])
        return plugin.handlers[type]
  }

  findResponder(output) {
    for (let plugin of Object.values(this.plugins))
      for (let responder of Object.values(plugin.responders || {}))
        if (responder.object.includes(output.constructor.name))
          return responder;
  }

  environment() {
    return Object.assign({},
        ...Object.values(this.plugins)
                 .map(plugin => plugin.environment)
                 .filter(environment => environment));
  }
}

module.exports = Settings;
