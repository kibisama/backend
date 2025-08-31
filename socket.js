const SocketIO = require("socket.io");
const {
  init: init_APPS_PICKUP,
  emitAll: emitAll_APPS_PICKUP,
} = require("./services/apps/pickup");

module.exports = (server, app) => {
  const io = SocketIO(server, {
    cors: {
      origin: "*",
    },
  });
  app.set("io", io);

  /**
   * APPS_PICKUP
   */
  const pickup = io.of("/pickup");
  init_APPS_PICKUP(app);
  pickup.on("connect", (socket) => {
    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(ip, socket.id, "Pickup Namespace Connected");
    emitAll_APPS_PICKUP(socket, app);
    socket.on("disconnect", () => {
      console.log(ip, socket.id, "Pickup Namespace Disconnected");
    });
    socket.on("state", (data) => {
      app.set("apps_pickup_state", data);
      pickup.emit("state", data);
    });
    socket.on("relation", (data) => {
      app.set("apps_pickup_relation", data);
      pickup.emit("relation", data);
    });
    socket.on("canvas", (data) => {
      app.set("apps_pickup_canvas", data);
      socket.broadcast.emit("canvas", data);
    });
    socket.on("clear_canvas", () => {
      app.set("apps_pickup_canvas", null);
      pickup.emit("canvas", null);
    });
    socket.on("notes", (data) => {
      if (app.get("apps_pickup_canva") && app.get("apps_pickup_items").length) {
        app.set("apps_pickup_notes", data);
        pickup.emit("notes", data);
      }
    });
    socket.on("items", (data) => {
      const items = app.get("apps_pickup_items");
      const { action, item } = data;
      if (action === "push") {
        if (item && !items.includes(item)) {
          items.push(item);
        }
      } else if (action === "pull") {
        const index = items.indexOf(item);
        if (index === 0) {
          items.shift();
        } else if (index > -1) {
          items.splice(index, 1);
        }
      }
      pickup.emit("items", items);
    });
    socket.on("date", (data) => {
      app.set("apps_pickup_date", data);
      pickup.emit("date", data);
    });
    socket.on("reset", () => {
      init_APPS_PICKUP(app);
      emitAll_APPS_PICKUP(pickup, app);
    });
    socket.on("refresh", () => {
      emitAll_APPS_PICKUP(socket, app);
    });
  });
};
