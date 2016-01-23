'use strict';

const app = require("koa")();
const router = require("..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

class MyHandler extends router.RequestHandler {
  constructor(opts) {
    super(opts);
    
    r.db("apidemo").table("routes")
    .changes({includeInitial: true})
    .then(cursor => cursor.each((err, change) => {
      if (change.old_val) this.deleteRoute(change.old_val);
      if (change.new_val) this.setRoute(change.new_val);
    }));
  }
}

app.use(require("kcors")());
app.use(require("koa-bodyparser")());
app.use(router.middleware({
  handler: new MyHandler({context: {r: r}, actionField: "query"})
}));

app.listen(8000, () => "Listening on port 8000");