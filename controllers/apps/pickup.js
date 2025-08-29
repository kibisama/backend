const Pickup = require("../../schemas/apps/pickup");
const fs = require("fs");
const dayjs = require("dayjs");
const { init, emitAll } = require("../../services/apps/pickup");

const path = process.env.PICKUP_IMG_LOCATION || `E:\\pickup`;

exports.post = async (req, res, next) => {
  const pickup = req.app.get("io").of("/pickup");
  const items = req.app.get("apps_pickup_items");
  const relation = req.app.get("apps_pickup_relation");
  const date = new Date();
  const _date = req.app.get("apps_pickup_date");
  const day = dayjs(_date || date);

  try {
    if (items.length === 0) {
      throw new Error();
    }
    const { notes } = req.body;

    const exDoc = await Pickup.find({
      deliveryDate: { $gte: day.startOf("d"), $lte: day.endOf("d") },
      rxNumber: { $in: items },
    });
    if (exDoc.length > 0) {
      pickup.emit("state", "error");
      req.app.set("apps_pickup_state", "standby");
      const intersection = items.filter((v) => exDoc[0].rxNumber.includes(v));
      return res.status(409).send({
        code: 409,
        message: `Following RxNumber(s) are already recorded as delivered: ${intersection.join(
          ", "
        )}`,
      });
    }
    const { _id } = await Pickup.create({
      rxNumber: items,
      relation,
      date,
      notes,
      deliveryDate: _date ? day : date,
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
    init(req.app);
    emitAll(pickup, req.app);
    return res
      .status(200)
      .send({ code: 200, message: "A pickup log was successfully saved." });
  } catch (e) {
    console.error(e);
    pickup.emit("state", "error");
    req.app.set("apps_pickup_state", "standby");
    res.status(500).send({
      code: 500,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};

/**
 * @typedef {object} Row
 * @property {import("mongoose").ObjectId} id
 * @property {string} rxNumber
 * @property {Date} deliveryDate
 * @property {Pickup.Relation} relation
 * @property {string} notes
 */

/**
 * @param {Pickup.Relation} relation
 * @returns {"Self"|"Family/Friend"|"Guardian/Caregiver"|"Other"}
 */
const relationToString = (relation) => {
  switch (relation) {
    case "self":
      return "Self";
    case "ff":
      return "Family/Friend";
    case "gc":
      return "Guardian/Caregiver";
    case "other":
      return "Other";
  }
};

/**
 * @param {[Pickup.Pickup]} pickups
 * @return {[Row]}
 */
const mapSearchResults = (pickups) => {
  const mappedResults = [];
  let id = 1;
  pickups.forEach((v, i) => {
    id += i;
    v.rxNumber.forEach((w, i) => {
      id += i;
      mappedResults.push({
        id,
        _id: v._id,
        rxNumber: w,
        deliveryDate: v.deliveryDate,
        relation: relationToString(v.relation),
        notes: v.notes,
      });
    });
  });
  return mappedResults;
};

exports.search = async (req, res, next) => {
  try {
    const { rxNumber, date } = req.query;
    const $and = [];
    rxNumber && $and.push({ rxNumber });
    if (date) {
      const day = dayjs(date);
      $and.push({
        deliveryDate: {
          $gte: day.startOf("d"),
          $lte: day.endOf("d"),
        },
      });
    }
    if ($and.length === 0) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const results = await Pickup.find({ $and });
    if (results.length === 0) {
      return res.status(404).send({ code: 404, message: "Not Found" });
    }
    return res.status(200).send({ code: 200, data: mapSearchResults(results) });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.png = (req, res) => {
  try {
    res.sendFile(path + `/${req.params._id}.png`);
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.report = async (req, res) => {
  try {
    const { _id, rxNumber } = req.params;
    const { deliveryDate, relation, notes } = await Pickup.findById(_id);
    res.status(200).send({
      code: 200,
      data: {
        deliveryDate: dayjs(deliveryDate).format("M/DD/YYYY HH:mm"),
        relation: relationToString(relation),
        notes,
      },
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
};
