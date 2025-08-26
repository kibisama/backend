exports.init = (app) => {
  app.set("apps_pickup_state", "standby");
  app.set("apps_pickup_relation", "self");
  app.set("apps_pickup_canvas", null);
  app.set("apps_pickup_notes", "");
  app.set("apps_pickup_items", []);
  app.set("apps_pickup_date", null);
};
exports.emitAll = (socket, app) => {
  socket.emit("state", app.get("apps_pickup_state"));
  socket.emit("relation", app.get("apps_pickup_relation"));
  socket.emit("canvas", app.get("apps_pickup_canvas"));
  socket.emit("notes", app.get("apps_pickup_notes"));
  socket.emit("items", app.get("apps_pickup_items"));
  socket.emit("date", app.get("apps_pickup_date"));
};
