const {EventEmitter} = require("events");

class PluginRealtime {
  static get name() { return "realtime" }
  
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