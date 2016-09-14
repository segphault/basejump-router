
let many = items => items.constructor === Array ? items : [items];

let timestamp = time => (time || new Date()).toLocaleTimeString();

let message = text => `\u{1b}[34m[${timestamp()}] ${text}\u{1b}[0m`;

let error = text => console.error(message(`\u{1b}[31m${text.trim()}`));

let log = text => console.log(message(`\u{1b}[33m${text.trim()}`));

let info = text => console.log(message(`\u{1b}[32m${text.trim()}`));

function fatal(text) {
  error(text);
  process.exit(1);
}

module.exports = {fatal, log, info, error, many};
