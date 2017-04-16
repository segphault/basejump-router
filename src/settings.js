const events = require("events");

class Settings {
  constructor(plugins, config) {
    this.events = new events.EventEmitter();
    this.plugins = {};

    for (let plugin of plugins)
      this.plugins[plugin.name] = plugin;

    if (config)
      this.load(config);
  }

  setItem(plugin, value, collection, suppressNotify) {
    if (!this.plugins[plugin])
      throw `Can't apply settings to plugin that isn't present: ${plugin}`;
      
    this.plugins[plugin].settings.setItem(value, collection);

    if (!suppressNotify)
      this.events.emit("set", {plugin, collection, value});
  }

  deleteItem(plugin, value, collection, suppressNotify) {
    if (!this.plugins[plugin])
      throw `Can't remove settings from plugin that isn't present: ${plugin}`;

    this.plugins[plugin].settings.deleteItem(value, collection);

    if (!suppressNotify)
      this.events.emit("delete", {plugin, collection, value});
  }
  
  load(config) {
    for (let plugin of config.plugins || [])
      for (let collection of plugin.collections || [])
        for (let item of collection.items || [])
          this.setItem(plugin.name, item, collection.name);
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
  
  params() {
    return Object.values(this.plugins)
                 .map(plugin => plugin.params)
                 .filter(params => params);
  }
}

module.exports = Settings;
