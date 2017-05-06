const {Basejump} = require("..");
const config = require("./support/config.js");
const request = require("./support/request")(config.baseAddress);

describe("error handling", () => {
  let basejump;
  let server;

  beforeAll(() => {
    basejump = new Basejump();

    basejump.get("/test/throw/string", {
      action() { throw "Error Message" }
    });

    basejump.get("/test/throw/fn", {
      action(params, request) { request.throw("Error Message", 451) }
    });

    basejump.get("/test/throw/fn/obj", {
      action(params, request) { request.throw({success: false}, 451) }
    });

    basejump.get("/test/throw/error", {
      action() { throw new Error("Error Message") }
    });

    basejump.get("/test/throw/object", {
      action() { throw {expose: true, code: 451, message: "Error Message"} }
    });

    basejump.get("/test/exception", {
      action() { JSON.parse("") }
    });

    server = basejump.listen(config.port);
  });

  afterAll(() => server.close());

  it("for thrown strings", async done => {
    let response = await request.get("/test/throw/string");

    expect(response.statusCode).toEqual(400);
    expect(response.body).toEqual("Error Message");
    done();
  });

  it("for request throw method", async done => {
    let response = await request.get("/test/throw/fn");

    expect(response.statusCode).toEqual(451);
    expect(response.body).toEqual("Error Message");
    done();
  });

  it("for request throw method with object message", async done => {
    let response = await request.get("/test/throw/fn/obj");

    expect(response.statusCode).toEqual(451);
    expect(response.body.success).toEqual(false);
    done();
  });

  it("for thrown error", async done => {
    let response = await request.get("/test/throw/error");

    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual("Server Error");
    done();
  });

  it("for thrown object", async done => {
    let response = await request.get("/test/throw/object");

    expect(response.statusCode).toEqual(451);
    expect(response.body).toEqual("Error Message");
    done();
  });

  it("for raised exception", async done => {
    let response = await request.get("/test/exception");

    expect(response.statusCode).toEqual(500);
    expect(response.body).toEqual("Server Error");
    done();
  });
})
