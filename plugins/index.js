const {EventEmitter} = require("events");
const path = require("path");

const methods = {
  middleware: Symbol("middleware"),
  factory: Symbol("factory"),
  plugins: Symbol("plugins"),
  request: Symbol("request"),
  settings: Symbol("settings"),
  load: Symbol("load")
};

class Plugin extends EventEmitter {
  constructor() {
    super();
    this[methods.plugins] = new Map(); 
  }

  [methods.middleware](feature, ...args) {
    let plugins = [...this[methods.plugins].values()].filter(plugin => plugin[feature]);
    let run = n => plugins[n] && plugins[n][feature](...args, () => run(n + 1));
    return run(0);
  }

  [methods.factory](name) {
    let paths = [path.resolve(__dirname), "plugins", "node_modules"];
    let ctor = require(require.resolve(name, {paths}));
    return new ctor();
  }

  [methods.load](items, factory) {
    for (let {id, settings, module, plugins} of items) {
      let plugin = (factory || this[methods.factory])(module);
      this[methods.plugins].set(id || plugin, plugin);

      if (settings && plugin[methods.settings])
        plugin[methods.settings](settings);
      
      if (plugins && plugin[methods.load])
        plugin[methods.load](plugins);
    }
  }
}

module.exports = Object.assign(Plugin, methods);