
const {Basejump} = require("..");
const config = require("./support/config");
const request = require("./support/request")(config.baseAddress);

describe("router plugin", () => {
  describe("prefix", () => {
    let basejump;
    let server;

    beforeAll(() => {
      basejump = new Basejump();
      basejump.plugins.settings("router", {prefix: "/foo"});
      basejump.get("/test", {action() {return {success: true}}});

      server = basejump.listen(config.port);
    });

    afterAll(() => server.close());

    it("matches valid request", async done => {
      let response = await request.get("/foo/test");

      expect(response.statusCode).toEqual(200);
      expect(response.body.success).toEqual(true);
      done();
    });

    it("matches valid request", async done => {
      let response = await request.get("/test");

      expect(response.statusCode).toEqual(404);
      done();
    });
  });
});
