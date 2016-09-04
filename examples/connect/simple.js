const connect = require("connect");
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
  }
]

var app = connect();

app.use(basejump.middleware.connect({
  config: {route: routes},
  context: {r: require("rethinkdbdash")({host: "rethinkdb-stable"})}
}));

app.use((req, res, next) => {
  console.log("Received request:", req.url);
  next();
})

app.listen(8000, () => console.log("Listening on port 8000"));
