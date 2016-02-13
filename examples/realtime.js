'use strict';

const http = require("http");
const app = require("koa")();
const socketio = require("socket.io");
const router = require("..");
const r = require("rethinkdbdash")({host: "rethinkdb-stable"});

const server = http.createServer(app.callback());
const io = socketio(server);

const handler = new router.RequestHandler({
  swagger: "routes.yaml",
  context: {r: r}
});

app.use(require("kcors")());
app.use(require("koa-bodyparser")());
app.use(router.middleware.koa({handler: handler}));

io.on("connection", socket => {
  socket.on("endpoint", router.middleware.sockio({handler: handler}));
});

server.listen(8000, () => console.log("Listening on port 8000"));
