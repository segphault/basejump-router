const {EventEmitter} = require("events");
const {Basejump} = require("../..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

const router = new Basejump();
router.configure({
  static: {settings: {path: "public"}}
});

router.on("failure", err => console.log(err));

router.get("/test/respond", {
  response(output, request) {
    request.send("This is a test", {"Content-Type": "text/plain"});
  }
})

router.get("/test/fellowship", {
  action(params) {
    return r.db("test").table("fellowship");
  }
});

router.get("/blah", {
  action: "(params) => ({succes: true})"
});

router.get("/test/realtime", {
  action(params) {
    let ev = new EventEmitter();
    let interval = setInterval(() =>
      ev.emit("event", "test", {foo: "bar"}), 2000);

    ev.on("close", () => clearInterval(interval));
    return ev;
  }
})

router.get("/test/fellowship/:species", {
  parameters: [
    {in: "path", name: "species", type: "string"}
  ],
  action(params) {
    return r.db("test").table("fellowship").filter(params);
  }
});

router.post("/test/fellowship", {
  parameters: [
    {in: "body", name: "name", type: "string", required: true},
    {in: "body", name: "species", type: "string", required: true}
  ],
  action(params) {
    return r.db("test").table("fellowship").insert(params);
  }
});

router.post("/test/schema", {
  schema: {
    type: "object",
    properties: {
      name: {type: "string"},
      species: {type: "string"},
    },
    required: ["name", "species"],
    additionalProperties: false
  },
  action(params) {
    return {sucess: true, value: params};
  }
});

router.post("/test/schema/:id", {
  parameters: [
    {in: "path", name: "id", type: "number"},
  ],
  schema: {
    type: "object",
    properties: {
      name: {type: "string"},
      species: {type: "string"},
    },
    required: ["name", "species"],
    additionalProperties: false
  },
  action(params) {
    return {sucess: true, value: params};
  }
});

router.listen(8000, () => console.log("Running"));
