'use strict';

const app = require("koa")();
const router = require("..");
const r = require("rethinkdbdash")();

app.use(require("kcors")());
app.use(require("koa-bodyparser")());
app.use(router.middleware({
  routes: "routes.yaml",
  context: {r: r}
}));

app.listen(8000, () => "Listening on port 8000");