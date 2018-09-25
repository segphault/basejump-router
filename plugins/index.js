const path = require("path");

const methods = {
  request: Symbol("request"),
  settings: Symbol("settings"),
  load: Symbol("load")
};

class Plugins {
  constructor() {
    this.plugins = new Map();
  }

  get(id) {
    return this.plugins.get(id);
  } 

  middleware(feature, ...args) {
    let plugins = [...this.plugins.values()].filter(plugin => plugin[feature]);
    let run = n => plugins[n] && plugins[n][feature](...args, () => run(n + 1));
    return run(0);
  }

  factory(name) {
    let paths = [path.resolve(__dirname), "plugins", "node_modules"];
    let ctor = require(require.resolve(name, {paths}));
    return new ctor();
  }

  load(items, factory) {
    for (let {id, settings, module, plugins} of items) {
      let plugin = (factory || this.factory)(module);
      this.plugins.set(id || plugin, plugin);

      if (settings && plugin[methods.settings])
        plugin[methods.settings](settings);
      
      if (plugins && plugin[methods.load])
        plugin[methods.load](plugins);
    }
  }

  [Symbol.iterator]() {
    return this.plugins.entries();
  }
}

module.exports = Object.assign(Plugins, methods);