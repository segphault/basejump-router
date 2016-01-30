'use strict';

var RequestHandler = require("./requests");

module.exports = function(opts) {
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
  }
}
