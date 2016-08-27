const app = require("koa")();
const router = require("../..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

class MyHandler extends router.RequestHandler {
  constructor(opts) {
    super(opts);

    r.db("basejump").table("route")
    .changes({includeInitial: true})
    .then(cursor => cursor.each((err, change) => {
      if (change.old_val) this.routes.deleteRoute(change.old_val);
      if (change.new_val) this.routes.setRoute(change.new_val);
    }));
  }
}

app.use(require("kcors")());
app.use(require("koa-bodyparser")());
app.use(router.middleware.koa({
  handler: new MyHandler({context: {r: r}})
}));

app.listen(8000, () => console.log("Listening on port 8000"));
