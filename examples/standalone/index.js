const http = require("http");
const basejump = require("../..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

const router = new basejump.Router({}, {}, [
  basejump.plugins.router,
  basejump.plugins.schema
]);

const server = http.createServer((req, res) => router.request(req, res));

router.on("failure", err => console.log(err));

router.add("get", "/test/fellowship", {
  action(params) {
    return r.db("test").table("fellowship");
  }
});

router.add("get", "/test/fellowship/:species", {
  parameters: [
    {in: "path", name: "species", type: "string"}
  ],
  action(params) {
    return r.db("test").table("fellowship").filter(params);
  }
});

router.add("post", "/test/fellowship", {
  parameters: [
    {in: "body", name: "name", type: "string", required: true},
    {in: "body", name: "species", type: "string", required: true}
  ],
  action(params) {
    return r.db("test").table("fellowship").insert(params);
  }
});

router.add("post", "/test/schema", {
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

router.add("post", "/test/schema/:id", {
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

server.listen(8000);
