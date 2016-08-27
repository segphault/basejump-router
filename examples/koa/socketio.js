const http = require("http");
const app = require("koa")();
const socketio = require("socket.io");
const router = require("..");

const server = http.createServer(app.callback());
const io = socketio(server);

const routes = [
  {
    path: "/test",
    method: "get",
    settings: {
      action: "r.range(1,10).map(r.row.mul(2))"
    }
  },
  {
    path: "/test/:filter",
    method: "get",
    settings: {
      parameters: [{
        in: "path",
        name: "filter",
        required: true,
        type: "number"
      }],
      action: "r.range(1,10).filter(r.row.gt(params.filter))"
    }
  }
]

const handler = new router.RequestHandler({
  configuration: {routes: routes},
  context: {r: require("rethinkdbdash")({host: "rethinkdb-stable"})}
});

app.use(require("kcors")());
app.use(require("koa-bodyparser")());
app.use(router.middleware.koa({handler: handler}));

io.on("connection", socket => {
  socket.on("endpoint", router.middleware.sockio({handler: handler}));
});

server.listen(8000, () => console.log("Listening on port 8000"));
