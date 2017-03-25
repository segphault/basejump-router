const {many} = require("./utils");

const defaultResponders = [
  {
    name: "html", content: "text/html", object: "String",
    responder(route, request, output) {
      request.send(this.content, output);
    }
  },
  {
    name: "json", content: "application/json", object: ["Object", "Array"],
    responder(route, request, output) {
      request.send(this.content, JSON.stringify(output));
    }
  },
  {
    name: "stream", content: "text/event-stream", object: "EventEmitter",
    responder(route, request, output) {
      output.on("update", request.stream());
      request.onclose(() => output.emit("close"));
    }
  },
  {
    name: "cursor", content: "text/event-stream", object: "Cursor",
    responder(route, request, output) {
      let stream = request.stream();
      output.each((err, change) => stream(change));
      request.onclose(() => output.close());
    }
  }
];

class Responders {
  constructor(responders = defaultResponders) {
    this.responders = responders;
  }
  
  add(responders) {
    for (let responder of many(responders))
      this.responders.push(responder);
  }
  
  find(route, request, output) {
    return this.responders.find(r =>
      many(r.object).includes(output.constructor.name));
  }
}

module.exports = Responders;