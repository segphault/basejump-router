const Plugin = require("./plugins");
const Server = require("./server");

class Basejump extends Plugin {
  [Plugin.load](servers) {
    super[Plugin.load](servers, name => new Server());
    for (let [id, plugin] of this[Plugin.plugins])
      plugin.start();
  }
}

module.exports = Basejump;