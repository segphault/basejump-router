const RequestHandler = require("./requests");
const ServerRequest = require("./server");

module.exports = {
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
      try {
        let request = new ServerRequest(this.req, this.res);
        let match = handler.match(request.method, request.path);

        if (match) {
          if (this.request.body)
            request.params.body = this.request.body;

          let output = handler.handle(yield request.parse(), match);
          if (output) this.body = yield output;
        }
      }
      catch (err) {
        if (err.expose) this.throw(err.error, err.message);
        else throw err;
      }

      yield next;
    };
  }
};
