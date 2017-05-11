const {EventEmitter} = require("events");

const meta = {
  name: "realtime",
  displayName: "Realtime",
  description: "Realtime streaming from endpoints",
  configurable: false
};

class PluginRealtime {
  static get meta() { return meta }

  get environment() {
    return {EventEmitter}
  }

  get responders() {
    let events = {
      object: ["EventEmitter"],
      responder(output, request) {
        output.on("event", request.stream())
        request.onclose(() => output.emit("close", null));
      }
    };

    return {events};
  }
}

module.exports = PluginRealtime;
