const SocketIO = require("socket.io");

const init_APPS_PICKUP = (app) => {
  app.set("apps_pickup_state", "standby");
  app.set("apps_pickup_relation", "self");
  app.set("apps_pickup_canvas", null);
  app.set("apps_pickup_notes", "");
  app.set("apps_pickup_items", []);
  app.set("apps_pickup_date", null);
};

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
    socket.emit("state", app.get("apps_pickup_state"));
    socket.emit("relation", app.get("apps_pickup_relation"));
    socket.emit("canvas", app.get("apps_pickup_canvas"));
    socket.emit("notes", app.get("apps_pickup_notes"));
    socket.emit("items", app.get("apps_pickup_items"));
    socket.emit("date", app.get("apps_pickup_date"));
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
      app.set("apps_pickup_notes", data);
      pickup.emit("notes", data);
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
  });
};
