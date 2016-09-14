#!/usr/bin/env node

const RouteManager = require("./src/routes");
const RequestHandler = require("./src/requests");
const ServerRequest = require("./src/server");
const middleware = require("./src/middleware");
const {fatal, log} = require("./src/utils");

const cli = {
  alias: {c: "context", p: "port", h: "help"},
  default: {context: "context", port: 8000}
};

const usage = `Usage: basejump [options] ROUTES

  -c, --context <module>    JavaScript module to expose to route handlers
  -p, --port <port>         Port to use for the server (Default: 8000)
  -b, --bind <host>         Host to bind the server (Default: 0.0.0.0)
`;

function server(server, opts) {
  let handler = opts.handler || new RequestHandler(opts);
  server.on("request", ServerRequest.attach(handler));
  return server;
}

if (require.main === module) {
  const path = require("path");
  const fs = require("fs");

  let args = require("minimist")(process.argv.slice(2), cli);
  let routefile = args._[0];

  if (!routefile || args.help)
    return console.log(usage);

  let format = path.extname(routefile);
  if (format !== ".json" && format !== ".yaml")
    fatal("Can't identify the format of the route file");

  fs.readFile(routefile, (err, data) => {
    if (err) fatal(err);
    let config = data.toString("utf8");

    if (format === ".json")
      config = JSON.parse(config);

    if (format === ".yaml") {
      let yamlPath = path.join(process.cwd(), "node_modules", "js-yaml");
      try {config = require(yamlPath).safeLoad(config)}
      catch (err) {fatal(`Could not load YAML file:\n${err}`)}
    }

    let httpServer = require("http").createServer();
    let context = require(path.join(process.cwd(), args.context));
    let opts = {config: config, context: context};

    server(httpServer, opts).listen(args.port, args.bind, () =>
      log(`Server listening on port \u{1b}[36m${args.port}`));
  });
}

module.exports = {
  middleware, server, RouteManager, RequestHandler, ServerRequest
};
