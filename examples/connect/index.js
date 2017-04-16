const connect = require("connect");
const basejump = require("../..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

const router = new basejump.Router({}, {}, [
  basejump.plugins.router,
  basejump.plugins.schema
]);

router.on("failure", err => console.log(err));

router.add("get", "/test", {
  action(params) {
    return r.range(1,10).map(r.row.mul(2));
  }
});

router.add("get", "/test/:filter", {
  parameters: [
    {in: "path", name: "filter", required: true, type: "number"}
  ],
  action({filter}) {
    return r.range(1,10).filter(r.row.gt(filter));
  }
});

var app = connect();
app.use((req, res, next) => router.request(req, res, next));
app.listen(8000, () => console.log("Listening on port 8000"));
