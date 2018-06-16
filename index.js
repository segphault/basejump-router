const Plugins = require("./plugins");
const Server = require("./server");

class Basejump {
  constructor() {
    this.servers = new Plugins();
  }

  load(servers) {
    this.servers.load(servers, name => new Server());
    for (let [id, server] of this.servers)
      server.start();
  }
}

module.exports = Basejump;