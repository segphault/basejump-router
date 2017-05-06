#!/usr/bin/env node

const minimist = require("minimist");
const logging = require("./src/logging");
const {Basejump} = require("./index");

const cli = {alias: {e: "environment", p: "port", h: "help"}};
const usage = `Usage: basejump [options] ROUTES
  -e, --environment <module> JavaScript module to expose to route handlers
  -p, --port <port>          Port to use for the server (Default: 8000)
  -b, --bind <host>          Host to bind the server (Default: 0.0.0.0)
`;

(async () => {
  process.on("unhandledRejection", reject => console.log(reject));

  let args = minimist(process.argv.slice(2), cli);
  let path = args._[0];

  if (!path || args.help)
    return console.log(usage);

  let server = new Basejump();

  try {
    await server.load(path);
  }
  catch (err) {
    logging.error("Failed to load configuration:\n", err);
    process.exit();
  }

  server.on("failure", err => logging.error("ERROR:", err));
  server.on("request", ({method, path, request}) => {
    let ip = request.headers["x-forwarded-for"] ||
             request.connection.remoteAddress;
    logging.info("REQUEST:", method, path, "from", ip);
  });

  let port = args.port || server.settings.server.port || 8000;
  let bind = args.bind || server.settings.server.bind || "127.0.0.1";

  server.listen(port, bind, () =>
    logging.log("Basejump listening on port", port));

})();
