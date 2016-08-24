const RouteManager = require("./src/routes");
const RequestHandler = require("./src/requests");
const ServerRequest = require("./src/server");

const middleware = require("./src/middleware");

module.exports = {
  middleware, RouteManager, RequestHandler, ServerRequest
};

if (require.main === module) {
  const r = require("rethinkdbdash")({host: "rethinkdb-stable"});
  const http = require("http");

  const server = http.createServer();
  middleware.server({
    swagger: "examples/routes.yaml",
    context: {r: r}
  })(server);

  server.listen(8000, () => console.log("Server listening on port 8000"));
}
