#!/usr/bin/env node

const {format} = require("util");
const {resolve} = require("path");
const {Basejump, Settings} = require("./index");

const usage = `Usage: basejump [options] ROUTES
  --port <port>    Port to use for the server (Default: 8000)
  --bind <host>    Host to bind the server (Default: 0.0.0.0)
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
for (let argn = 2; argn < process.argv.length - 1; argn++)
  if (process.argv[argn].startsWith("--"))
    args[process.argv[argn].slice(2)] = process.argv[argn + 1].trim();

(async () => {
  if (process.argv.length < 3 || args.help)
    return console.log(usage);

  let settings = new Settings();
  let app = new Basejump(settings)

  try {
    let path = process.argv.slice(2).pop();
    settings.load(require(resolve(path)));
  }
  catch (err) {
    console.error(message(color.red, "Failed to load configuration:\n", err));
    process.exit();
  }

  app.on("failure", err => console.error(message(color.red, "ERROR:", err)));
  app.on("request", ({method, path, request}) => {
    let ip = request.headers["x-forwarded-for"] ||
             request.connection.remoteAddress;
    console.log(message(color.yellow, "REQUEST:", method, path, "from", ip));
  });

  let port = args.port || app.settings.server.port || 8000;
  let bind = args.bind || app.settings.server.bind || "127.0.0.1";

  app.listen(port, bind, () =>
    console.log(message(color.green, "Basejump listening on port", port)));
})();