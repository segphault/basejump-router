const {Basejump} = require("..");
const {request} = require("./support/utils")

describe("standalone server", () => {
  let basejump;
  let server;
  
  beforeAll(() => {
    basejump = new Basejump();
    
    basejump.get("/test", {action() {return {success: true}}});
    
    basejump.get("/test/path/:value", {
      parameters: [{in: "path", name: "value", type: "number"}],
      action(params) {return params}
    });
    
    basejump.get("/test/sandbox", {
      parameters: [{in: "query", name: "value", type: "number"}],
      action: "(params) => ({success: true, params})"
    });
    
    server = basejump.listen(8000);
  });
  
  afterAll(() => server.close());
  
  it("serves get requests correctly", async done => {
    let {response, output} = await request("get", "/test");
    
    expect(response.statusCode).toEqual(200)
    expect(output.success).toEqual(true);
    done();
  });
  
  it("supports path parameters", async done => {
    let {response, output} = await request("get", "/test/path/5");
    
    expect(response.statusCode).toEqual(200)
    expect(output.value).toEqual(5);
    done();
  });
  
  it("supports sandboxed actions", async done => {
    let {response, output} = await request("get", "/test/sandbox?value=10");
    
    expect(response.statusCode).toEqual(200)
    expect(output.success).toEqual(true);
    expect(output.params.value).toEqual(10);
    done();
  });
  
  describe("body parsing", () => {
    beforeAll(() => {
      basejump.post("/test/body/parsing", {
        parameters: [
          {in: "body", name: "prop1", type: "string"},
          {in: "body", name: "prop2", type: "number"},
        ],
        action(params) {
          return {success: true, params};
        }
      })
    });
    
    it("checks numbers in json", async done => {
      let {output, response} = await request("post", "/test/body/parsing", {
        body: {prop1: "test", prop2: 150}
      });
      
      expect(response.statusCode).toEqual(200)
      expect(output.params.prop2).toEqual(150);
      done();
    })
  })
  
  describe("json schema", () => {
    beforeAll(() => {
      basejump.post("/test/schema", {
        schema: {
          type: "object",
          properties: {
            prop1: {type: "string"},
            prop2: {type: "number"}
          },
          required: ["prop1", "prop2"],
          additionalProperties: false
        },
        action(params) {
          return {success: true, params};
        }
      });
    });
    
    it("accepts valid bodies", async done => {
      let {response, output} = await request("post", "/test/schema", {
        body: {prop1: "testing", prop2: 100}
      });
      
      expect(response.statusCode).toEqual(200)
      expect(output.params.prop2).toEqual(100);
      expect(output.success).toEqual(true);
      done();
    });
    
    it("rejects invalid bodies", async done => {
      let {response, output} = await request("post", "/test/schema", {
        body: {foo: "bar"}
      });
      
      expect(response.statusCode).toEqual(400)
      expect(output).toContain("Invalid body");
      done();
    });
  });
});

describe("config parser", () => {
  let basejump;
  let server;
  
  beforeAll(() => {
    
    let routes = [
      {
        path: "/test",
        method: "get",
        settings: {
          action(params) {
            return ({success: true});
          }
        }
      }
    ]
    
    basejump = new Basejump({
      config: {
        router: {collections: {routes}}
      }
    });
    
  });
   
  it("can parse route", () => {
    let routes = basejump.router.settings.plugins.router.routes;
    expect(routes.get("get").get("/test").settings.action(null).success).toEqual(true);
  })
})