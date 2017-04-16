const {EventEmitter} = require("events");

class EventStream extends EventEmitter {
  send(event, payload) {
    this.emit("event", event, payload);
  }
  
  close() {
    this.emit("close");
  }
}

module.exports = {
  name: "realtime",
  settings: null,
  environment: {EventStream},
  responders: {
    events: {
      content: "text/event-stream", object: ["EventStream"],
      responder(output, request, route) {
        output.on("event", request.stream())
        request.onclose(() => output.close());
      }
    },
  }
}