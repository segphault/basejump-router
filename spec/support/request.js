const http = require("http");
const url = require("url");

const methods = ["get", "post", "put", "delete"];

function raw(method, address, {body, headers} = {}) {
  return new Promise((resolve, reject) => {
    let {hostname: host, port, path} = url.parse(address);
    let options = {headers, port, host, path, method};

    let req = http.request(options, response => {
      response.body = "";
      response.on("data", chunk => response.body += chunk);
      response.on("end", () => resolve(response));
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

module.exports = baseAddress => {
  let request = async (method, path, {body, headers = {}} = {}) => {
    if (body && body.constructor.name === "Object") {
      body = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    let address = path.startsWith("/") ? baseAddress + path : path;
    let response = await raw(method, address, {body, headers});

    if (response.headers["content-type"] === "application/json")
      response.body = JSON.parse(response.body);

    return response;
  };

  request.raw = raw;
  for (let method of methods)
    request[method] = (path, opts) => request(method, path, opts);

  return request;
};
