const path = require("path");
const {createContext} = require("vm");
const Plugin = require("./plugins");

class Settings {
  static get pluginPaths() {
    return [path.resolve(__dirname, "plugins"), "plugins", "node_modules"];
  }

  constructor({environment = {}, plugins = []} = {}) {
    this.environment = environment;
    this.plugins = plugins;
  }
 
  load({environment, plugins, server}) {
    if (environment && typeof environment === "string")
      this.environment = require(path.resolve(environment));
    
    this.server = server;
    this.pluginIDs = new Map();
    this.context = createContext(this.environment);

    for (let {id, settings, plugin} of plugins) {
      let paths = this.constructor.pluginPaths;
      let constructor = require(require.resolve(plugin, {paths}));

      let instance = new constructor();
      if (settings && instance[Plugin.settings])
        instance[Plugin.settings](settings);

      this.plugins.push(instance);
      this.pluginIDs.set(id, instance);
    }
  }
}

module.exports = Settings;
