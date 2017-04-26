const http = require("http");
const {Request} = require("..");
const config = require("./support/config");
const request = require("./support/request")(config.baseAddress);

describe("request module", () => {
  let server;

  beforeAll(() => {
    server = http.createServer();
    server.listen(config.port);
  });

  afterAll(() => server.close());

  describe("parsing", () => {
    it("instantiates correctly", async done => {
      let test;

      server.once("request", (req, res) => {
        test = new Request(req, res);
        test.json({success: true});
      });

      let output = await request.get("/test?foo=bar");

      expect(test.method).toEqual("get");
      expect(test.path).toEqual("/test");
      expect(test.params.query.foo).toEqual("bar");
      expect(output.body.success).toEqual(true);
      done();
    });

    it("handles JSON body", async done => {
      let test;

      server.once("request", async (req, res) => {
        test = new Request(req, res);
        await test.parse();
        test.json({success: true});
      });

      let output = await request.post("/test", {body: {foo: "bar"}});
      expect(test.params.body.foo).toEqual("bar");
      expect(output.body.success).toEqual(true);
      done();
    });
  });

  describe("output", () => {
    it("sends JSON correctly", async done => {
      let test;

      server.once("request", async (req, res) => {
        test = new Request(req, res);
        test.json({success: true, foo: "bar", test: 10});
      });

      let output = await request.get("/test");
      expect(output.headers["content-type"]).toEqual("application/json");
      expect(output.body.success).toEqual(true);
      expect(output.body.foo).toEqual("bar");
      expect(output.body.test).toEqual(10);
      done();
    });
  });
});
