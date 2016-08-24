const RequestHandler = require("./requests");
const ServerRequest = require("./server");

module.exports = {
  server(opts) {
    opts = opts || {};
    let handler = opts.handler || new RequestHandler(opts);

    return server => {
      server.on("request", (req, res) => {
        let request = new ServerRequest(req, res);
        request.parse().then(req => handler.handle(req))
                       .then(out => request.handle(out))
                       .catch(err => request.handleError(err));
      });
    };
  },

  sockio(opts) {
    opts = opts || {};
    let handler = opts.handler || new RequestHandler(opts);

    return (input, callback) => {
      if (["get", "put", "post", "delete"].indexOf(input.method) < 0)
        return callback({error: 400, message: "Must provide valid method"});

      if (!input.path || typeof(input.path) !== "string")
        return callback({error: 400, message: "Must provide valid path"});

      try {
        handler.handle(input).then(output => callback(null, output));
      }
      catch (err) {
        if (err.expose) callback(err, null);
        else callback({error: 500, message: "Server Error"});
      }
    };
  },

  koa(opts) {
    opts = opts || {};
    let handler = opts.handler || new RequestHandler(opts);

    return function*(next) {
      let input = {
        method: this.request.method.toLowerCase(),
        path: this.request.path.trim().replace(/\/$/,""),
        params: {
          body: this.request.body,
          query: this.request.query
        }
      };

      try {
        let output = handler.handle(input);
        if (output) this.body = yield output;
      }
      catch (err) {
        if (err.expose) this.throw(err.error, err.message);
        else throw err;
      }

      return next;
    };
  }
};
