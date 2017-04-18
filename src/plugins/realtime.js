const {EventEmitter} = require("events");

module.exports = {
  name: "realtime",
  settings: null,
  environment: {EventEmitter},
  responders: {
    events: {
      object: ["EventEmitter"],
      responder(output, request) {
        output.on("event", request.stream())
        request.onclose(() => output.emit("close", null));
      }
    },
  }
};