const fs = require("fs");
const path = require("path");
const yaml = require("yamlparser");

const readFile = path =>
  new Promise((resolve, reject) =>
    fs.readFile(path, (err, data) =>
      err ? reject(err) : resolve(data.toString("utf8"))));

const stat = path =>
  new Promise(resolve =>
    fs.stat(path, (err, value) => resolve(err ? false : value)));

class Settings {
  static get formats() {
    return ["json", "yaml"];
  }

  static get pluginSearchPaths() {
    return [
      path.resolve(__dirname, "..", "plugins"),
      path.resolve("plugins"),
      path.resolve("node_modules")
    ];
  }

  constructor() {
    this.filename = null;
    this.config = null;
  }

  async load(filename) {
    this.filename = filename;

    let format = path.extname(filename).substring(1);
    if (!this.constructor.formats.includes(format) || !this[format])
      throw new Error(`Unrecognized config format: ${format}`);

    let data = this[format](await readFile(filename));

    if (!data.basejump) // TODO: JSON SChema
      throw new Error("Invalid configuration file");

    this.config = data.basejump;
  }

  settings() {
    return this.config.settings;
  }

  server() {
    return this.config.server;
  }

  plugins() {
    return Promise.all(
      (this.config.plugins || []).map(plugin => this.plugin(plugin)));
  }

  async plugin(name) {
    for (let searchPath of this.constructor.pluginSearchPaths) {
      let plugin = path.resolve(searchPath, name);
      if (await stat(plugin)) return require(plugin);
    }

    throw new Error(`Couldn't find plugin ${name}`);
  }

  async environment() {
    if (!this.config.environment) return;
    let file = path.join(process.cwd(), this.config.environment);
    if (await stat(file)) return require(file);
  }

  json(data) {
    return JSON.parse(data);
  }

  yaml(data) {
    return yaml.eval(data);
  }
}

module.exports = Settings;
