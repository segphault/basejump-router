#!/usr/bin/env node

const {format} = require("util");
const {resolve} = require("path");
const {readFile} = require("fs").promises;

const Plugins = require("./plugins");
const Server = require("./server");

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
  let module = require.resolve("yaml-js", {paths: ["node_modules"]});
  return require(module).load(await readFile(path));
}

function start(server) {
  server.on("failure", err =>
    console.error(message(color.red, "ERROR:", err)));
      
  server.on("listen", ({port}) =>
    console.log(message(color.green, "Basejump listening on port", port)));

  server.on("request", ({method, path, request: {ip}}) =>
    console.log(message(color.yellow, "REQUEST:", method, path, "from", ip)));
  
  server.start();
}

(async () => {
  if (process.argv.length < 3)
    return console.log("Usage: basejump ROUTES");

  try {
    let servers = new Plugins();
    let path = process.argv.slice(2).pop();
    let config = path.endsWith(".yaml") ?
                 await yaml(path) :
                 require(resolve(path));

    servers.load(config.servers, name => new Server());
    for (let [id, server] of servers)
      start(server);
  }
  catch (err) {
    console.error(message(color.red, "Failed to load configuration:\n", err));
    process.exit();
  }
})();