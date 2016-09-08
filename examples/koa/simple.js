const app = require("koa")();
const router = require("../..");

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
  }
]

app.use(router.middleware.koa({
  config: {route: routes},
  context: {r: require("rethinkdbdash")({host: "rethinkdb-stable"})}
}));

app.listen(8000, () => console.log("Listening on port 8000"));
