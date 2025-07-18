const PICKUP = require("../../schemas/apps/pickup");
const fs = require("fs");
const dayjs = require("dayjs");

const path = process.env.PICKUP_IMG_LOCATION || `E:\\pickup`;

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
        pickup.emit("date", deliveryDate);
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
    const { item } = req.body;
    if (item && !items.includes(item)) {
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
exports.date = (req, res) => {
  try {
    deliveryDate = dayjs(req.body.date);
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
    deliveryDate = undefined;
    state = "standby";
    notes = "";
    pickup.emit("items", items);
    pickup.emit("relation", relation);
    pickup.emit("notes", notes);
    pickup.emit("date", deliveryDate);
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
    const _relation = req.body.relation;
    relation = _relation;
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
  let reason = "";
  try {
    const _notes = req.body.notes;
    if (notes !== _notes) {
      notes = _notes;
    }
    state = "submit";
    const date = new Date();
    const day = dayjs(deliveryDate || date);
    const existingDoc = await PICKUP.find({
      rxNumber: { $in: items },
      deliveryDate: { $gte: day.startOf("d"), $lte: day.endOf("d") },
    });
    if (existingDoc.length > 0) {
      throw new Error();
    }
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
    const fileName = _id + ".png";
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    fs.writeFileSync(path + "/" + fileName, binaryData);
    pickup.emit("state", "submit");
    exports.clear(req, res);
  } catch (e) {
    console.log(e);
    if (reason) {
      pickup.emit("error", reason);
    }
    pickup.emit("state", "error");
    state = "standby";
    next(e);
  }
};

exports.find = async (req, res) => {
  try {
    const { rxNumber, deliveryDate } = req.body;
    switch (true) {
      case !!rxNumber:
        var _results = await PICKUP.find({ rxNumber });
        if (_results.length > 0) {
          const results = _results.map((v) => {
            return {
              _id: v._id,
              deliveryDate: dayjs(v.deliveryDate).format("M/DD/YYYY HH:mm"),
              rxNumber,
              relation: v.relation,
              notes: v.notes,
            };
          });
          return res.send({ results });
        }
        break;
      case !!deliveryDate:
        var day = dayjs(deliveryDate);
        var _results = await PICKUP.find({
          deliveryDate: { $gte: day.startOf("d"), $lte: day.endOf("d") },
        });
        if (_results.length > 0) {
          const results = [];
          _results.forEach((v) => {
            v.rxNumber.forEach((w) => {
              results.push({
                _id: v._id,
                deliveryDate: dayjs(v.deliveryDate).format("M/DD/YYYY HH:mm"),
                rxNumber: w,
                relation: v.relation,
                notes: v.notes,
              });
            });
          });
          return res.send({ results });
        }
        break;
      default:
    }
    res.sendStatus(404);
  } catch (e) {
    console.log(e);
  }
};

exports.png = async (req, res) => {
  try {
    res.sendFile(path + `/${req.params._id}.png`);
  } catch (e) {
    console.log(e);
  }
};

exports.proof = async (req, res) => {
  try {
    const { _id, rxNumber } = req.body;
    const { deliveryDate, relation, notes } = await PICKUP.findById(_id);
    res.send({
      deliveryDate: dayjs(deliveryDate).format("M/DD/YYYY HH:mm"),
      relation,
      notes,
    });
  } catch (e) {
    console.log(e);
  }
};
