#!/usr/bin/env node

const {format} = require("util");
const {resolve} = require("path");
const Basejump = require(".");
const Plugin = require("./plugins");

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

async function yaml(path) {
  let file = await require("fs/promises").readFile(path);
  let module = require.resolve("yaml-js", {paths: ["node_modules"]});
  return require(module).load(file);
}

(async () => {
  if (process.argv.length < 3)
    return console.log("Usage: basejump ROUTES");

  let app = new Basejump();

  try {
    let path = process.argv.slice(2).pop();
    let config = path.endsWith(".yaml") ? await yaml(path) : require(resolve(path));
    app.load(config.servers);
  }
  catch (err) {
    console.error(message(color.red, "Failed to load configuration:\n", err));
    process.exit();
  }

  for (let [id, server] of app.servers) {
    server.on("failure", err =>
      console.error(message(color.red, "ERROR:", err)));
    
    server.on("listen", ({port}) =>
      console.log(message(color.green, "Basejump listening on port", port)));

    server.on("request", ({method, path, request}) => {
      let ip = request.headers["x-forwarded-for"] ||
              request.connection.remoteAddress;
      console.log(message(color.yellow, "REQUEST:", method, path, "from", ip));
    });
  }

})();