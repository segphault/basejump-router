'use strict';

var RequestHandler = require("./requests");

module.exports = function(opts) {
  opts = opts || {};
  let handler = opts.handler || new RequestHandler(opts);

  return function*(next) {
    let output = handler.handle({
      method: this.request.method.toLowerCase(),
      path: this.request.path.trim().replace(/\/$/,""),
      params: {
        body: this.request.body,
        query: this.request.query
      }
    });

    if (output) this.body = yield output;
    return next;
  }
}
