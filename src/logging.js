const {format} = require("util");

const colors = {
  reset: "\033[0m",
  red: "\033[31m",
  green: "\033[32m",
  yellow: "\033[33m",
  blue: "\033[34m",
  purple: "\033[35m",
  cyan: "\033[36m",
};

const timestamp = time =>
  (time || new Date()).toLocaleTimeString();

const message = (...args) =>
  [colors.blue, `[${timestamp()}]`, format(...args), colors.reset].join("");

module.exports = {
  message, timestamp, colors,
  log(...args) {console.log(message(colors.green, ...args))},
  info(...args) {console.log(message(colors.yellow, ...args))},
  warn(...args) {console.warn(message(colors.yellow, ...args))},
  error(...args) {console.error(message(colors.red, ...args))}
};
