const {EventEmitter} = require("events");
const {Plugin} = require("..");

class Realtime {
  event({event = "data", data = {}} = {}) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  async events(request, content) {
    request.closed.then(() => content.return());
    
    let headers = {
      "content-type": "text/event-stream",
      "connection": "keep-alive"
    };

    let event = this.event;
    async function* body() {
      for await (let item of content)
        yield event(item);
    }

    request.respond({code: 200, headers, body: body()});
  }

  [Plugin.response](request, route, output, next) {
    if (output[Symbol.asyncIterator])
      this.events(request, output);
    else if (output instanceof EventEmitter)
      output.on("event", item =>
        request.response.write(this.event(item)));
    else next();
  }
}

module.exports = Realtime;