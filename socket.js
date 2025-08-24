const SocketIO = require("socket.io");

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
  app.set("apps_pickup_relation", "self");
  app.set("apps_pickup_canvas", null);
  app.set("apps_pickup_notes", "");
  app.set("apps_pickup_items", []);
  pickup.on("connect", (socket) => {
    const req = socket.request;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(ip, socket.id, "Pickup Namespace Connected");
    socket.emit("relation", app.get("apps_pickup_relation"));
    socket.emit("canvas", app.get("apps_pickup_canvas"));
    socket.emit("notes", app.get("apps_pickup_notes"));
    socket.emit("items", app.get("apps_pickup_items"));
    socket.on("disconnect", () => {
      console.log(ip, socket.id, "Pickup Namespace Disconnected");
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
        } else if (i > -1) {
          items.splice(index, index);
        }
      }
      console.log("items", item);
      pickup.emit("items", items);
    });
  });
};
