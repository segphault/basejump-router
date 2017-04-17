const connect = require("connect");
const {Basejump} = require("../..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

const router = new Basejump();

router.on("failure", err => console.log(err));

router.get("/test", {
  action(params) {
    return r.range(1,10).map(r.row.mul(2));
  }
});

router.get("/test/:filter", {
  parameters: [
    {in: "path", name: "filter", required: true, type: "number"}
  ],
  action({filter}) {
    return r.range(1,10).filter(r.row.gt(filter));
  }
});

var app = connect();
app.use(router.middleware);
app.listen(8000, () => console.log("Listening on port 8000"));
