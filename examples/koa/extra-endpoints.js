const app = require("koa")();
const route = require("koa-route");
const basejump = require("../..");

const routes = [
  {
    path: "/test",
    method: "get",
    settings: {
      action: "r.range(1,10).map(r.row.mul(2))"
    }
  },
  {
    path: "/test/:filter",
    method: "get",
    settings: {
      parameters: [{
        in: "path",
        name: "filter",
        required: true,
        type: "number"
      }],
      action: "r.range(1,10).filter(r.row.gt(params.filter))"
    }
  },
  {
    path: "/test",
    method: "post",
    settings: {
      parameters: [{
        in: "body",
        name: "body",
        schema: {type: "object", properties: {qwerty: {type: "string"}}}
      }],
      action: "r.expr({success: params.body.qwerty})"
    }
  }
]

app.use(require("koa-bodyparser")());
app.use(basejump.middleware.koa({
  config: {route: routes},
  context: {r: require("rethinkdbdash")({host: "rethinkdb-stable"})}
}));

app.use(route.get("/another", function*() {
  this.body = {test: [1,2,3,4,5]};
}));

app.listen(8000, () => console.log("Listening on port 8000"));
