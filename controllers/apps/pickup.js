const PICKUP = require("../../schemas/apps/pickup");
const fs = require("fs");

let items = [];
let relation = "self";
let deliveryDate = null;
let notes = "";
let state = "standby";

exports.get = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    const { type } = req.params;
    switch (type) {
      case "state":
        pickup.emit("state", state);
        break;
      case "items":
        pickup.emit("items", items);
        break;
      case "canvas":
        pickup.emit("canvas", req.app.get("apps_pickup_canvas"));
        break;
      case "relation":
        pickup.emit("relation", relation);
        break;
      case "notes":
        pickup.emit("notes", notes);
        break;
      case "date":
        break;

      default:
    }
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
      pickup.emit("items", items);
    }
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
    }
    pickup.emit("items", items);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.notes = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    notes = req.body.notes;
    pickup.emit("notes", notes);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.clear = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    items = [];
    relation = "self";
    date = null;
    state = "standby";
    pickup.emit("items", items);
    pickup.emit("relation", relation);
    // init date
    exports.clearCanvas(req, res);
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

exports.setRelation = (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    relation = req.body.relation;
    pickup.emit("relation", relation);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.preSubmit = async (req, res) => {
  try {
    const pickup = req.app.get("io").of("/pickup");
    state = "pre-submit";
    pickup.emit("state", "pre-submit");
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
  }
};
exports.submit = async (req, res, next) => {
  const pickup = req.app.get("io").of("/pickup");
  try {
    state = "submit";
    const date = new Date();
    const { _id } = await PICKUP.create({
      rxNumber: items,
      relation,
      date,
      notes,
      deliveryDate: deliveryDate ? deliveryDate : date,
    });

    const base64Data = req.app
      .get("apps_pickup_canvas")
      .replace(/^data:image\/png;base64,/, "");
    const binaryData = Buffer.from(base64Data, "base64");
    const path = process.env.PICKUP_IMG_LOCATION || `D:\\`;
    const fileName = _id + ".png";
    fs.writeFileSync(path + "/" + fileName, binaryData);
    exports.clear(req, res);
    pickup.emit("state", "submit");
  } catch (e) {
    state = "error";
    pickup.emit("state", "error");
    console.log(e);
  }
};

// exports.findByRxNumber = async (req, res, next) => {
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
