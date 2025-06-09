let items = [];
let relation = "self";

exports.get = async (req, res, next) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    pickup.emit("get", items);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.remove = async (req, res, next) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    const i = items.indexOf(req.body.item);
    if (i === 0) {
      items.shift();
    } else if (i > -1) {
      items.splice(i, i);
      res.sendStatus(200);
    }
    pickup.emit("get", items);
  } catch (e) {
    console.log(e);
  }
};
exports.add = async (req, res, next) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    const item = req.body.item;
    if (!items.includes(item)) {
      items.push(item);
      pickup.emit("get", items);
    }
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.getCanvas = async (req, res, next) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    pickup.emit("canvas", req.app.get("apps_pickup_canvas"));
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
