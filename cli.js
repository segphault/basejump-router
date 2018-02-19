#!/usr/bin/env node

const {format} = require("util");
const {Basejump} = require("./index");

const usage = `Usage: basejump [options] ROUTES
  --port <port>          Port to use for the server (Default: 8000)
  --bind <host>          Host to bind the server (Default: 0.0.0.0)
`;

const color = {
  reset: "\u{1b}[0m",
  red: "\u{1b}[31m",
  green: "\u{1b}[32m",
  yellow: "\u{1b}[33m",
  blue: "\u{1b}[34m",
};

const timestamp = time =>
  (time || new Date()).toLocaleTimeString();

const message = (...args) =>
  [color.blue, `[${timestamp()}]`, format(...args), color.reset].join("");

process.on("unhandledRejection", reject => console.log(reject));

let args = {};
let path = process.argv.slice(2).pop();

for (let argn = 2; argn < process.argv.length - 1; argn++)
  if (process.argv[argn].startsWith("--"))
    args[process.argv[argn].slice(2)] = process.argv[argn + 1].trim();

(async () => {
  if (process.argv.length < 3 || args.help)
    return console.log(usage);

  let server = new Basejump();

  try {
    await server.load(path.trim());
  }
  catch (err) {
    console.error(message(color.red, "Failed to load configuration:\n", err));
    process.exit();
  }

  server.on("failure", err => console.error(message(color.red, "ERROR:", err)));
  server.on("request", ({method, path, request}) => {
    let ip = request.headers["x-forwarded-for"] ||
             request.connection.remoteAddress;
    console.log(message(color.yellow, "REQUEST:", method, path, "from", ip));
  });

  let port = args.port || server.settings.server.port || 8000;
  let bind = args.bind || server.settings.server.bind || "127.0.0.1";

  server.listen(port, bind, () =>
    console.log(message(color.green, "Basejump listening on port", port)));
})();

/*
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
*/