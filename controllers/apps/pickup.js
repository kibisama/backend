const PICKUP = require("../../schemas/apps/pickup");
let items = [];
let relation = "self";
let date = null;

exports.clear = async (req, res, next) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    items = [];
    relation = "self";
    date = null;
    req.app.set("apps_pickup_canvas", "");
    pickup.emit("get", items);
    pickup.emit("relation", relation);
    pickup.emit("clear-canvas");
    // emit date
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
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
exports.getRelation = async (req, res, next) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    pickup.emit("relation", relation);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.selectRelation = async (req, res, next) => {
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
