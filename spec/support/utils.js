const http = require("http");
const url = require("url");

function request(method, address, {body, headers} = {}) {
  return new Promise((resolve, reject) => {
    let {hostname, port, path} = url.parse(address);
    
    let options = {
      host: hostname,
      headers: headers || {},
      port: port || 8000,
      path, method
    };
    
    if (body && body.constructor.name === "Object") {
      body = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
    }
    
    let req = http.request(options, response => {
      let output = "";
      response.on("data", chunk => output += chunk);
      response.on("end", () => {
        
        if (response.headers["content-type"] === "application/json")
          output = JSON.parse(output);
        
        resolve({response, output})
      });
    });
    
    req.on("error", reject);
    
    if (body)
      req.write(body);
      
    req.end();
  });
}

module.exports = {request};
