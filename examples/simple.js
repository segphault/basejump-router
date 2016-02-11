'use strict';

const app = require("koa")();
const router = require("..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

app.use(require("kcors")());
app.use(require("koa-bodyparser")());
app.use(router.middleware({
  swagger: "routes.yaml",
  context: {r: r}
}));

app.listen(8000, () => "Listening on port 8000");
