const SocketIO = require("socket.io");

module.exports = (server, app) => {
  const io = SocketIO(server, {
    cors: {
      origin: "http://localhost:3000",
    },
  });
  app.set("io", io);
  const pickup = io.of("/pickup");
  pickup.on("connect", (socket) => {
    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(ip, socket.id, "Pickup Namespace Connected");
    socket.on("disconnect", () => {
      console.log(ip, socket.id, "Pickup Namespace Disconnected");
    });
    socket.on("canvas", (data) => {
      socket.broadcast.emit("canvas", data);
      app.set("apps_pickup_canvas", data);
    });
  });
};
