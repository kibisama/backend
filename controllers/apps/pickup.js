const PICKUP = require("../../schemas/apps/pickup");
let items = [];
let relation = "self";
let date = null;

exports.clear = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    items = [];
    relation = "self";
    date = null;
    pickup.emit("get", items);
    pickup.emit("relation", relation);
    // init date
    exports.clearCanvas(req, res);
  } catch (e) {
    console.log(e);
  }
};
exports.get = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    pickup.emit("get", items);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.remove = (req, res) => {
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
exports.clearCanvas = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    req.app.set("apps_pickup_canvas", "");
    pickup.emit("clear-canvas");
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.add = (req, res) => {
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
exports.getCanvas = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    pickup.emit("canvas", req.app.get("apps_pickup_canvas"));
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.getRelation = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    pickup.emit("relation", relation);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.selectRelation = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    relation = req.body.relation;
    pickup.emit("relation", relation);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.submit = async (req, res, next) => {
  try {
    await PICKUP.create({
      rxNumber: items,
      relation,
      dateSaved: new Date(),
      deliveryDate: date ? date : new Date(),
    });
  } catch (e) {
    console.log(e);
  }
};
// exports.findByDeliveryDate = async (req, res, next) => {
//   try {
//   } catch (e) {
//     console.log(e);
//   }
// };
// exports.findByUpdateDate = async (req, res, next) => {
//   try {
//   } catch (e) {
//     console.log(e);
//   }
// };
