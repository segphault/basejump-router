module.exports = {
  port: 9000,
  baseAddress: "http://localhost:9000"
};

process.on("unhandledRejection", (reject, p) => console.log(reject, p));
