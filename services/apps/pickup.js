const fs = require("fs");
const Pickup = require("../../schemas/apps/pickup");
const dayjs = require("dayjs");

exports.path = process.env.PICKUP_IMG_LOCATION || `E:\\pickup`;
const path = exports.path;

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

/**
 * @typedef {Pickup.Pickup} Pickup
 */

/**
 * @param {[string]} items
 * @param {Date} date
 * @returns {Promise<[Pickup]|undefined>}
 */
exports.findEx = async (items, date) => {
  try {
    const day = dayjs(date);
    return await Pickup.find({
      deliveryDate: { $gte: day.startOf("d"), $lte: day.endOf("d") },
      rxNumber: { $in: items },
    });
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {typeof Pickup.schema.obj} params
 * @param {string} base64
 * @returns {Promise<Pickup|undefined>}
 */
exports.createPickup = async (params, base64) => {
  try {
    const pickup = await Pickup.create(params);
    const binaryData = Buffer.from(base64, "base64");
    const fileName = pickup._id + ".png";
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    fs.writeFileSync(path + "/" + fileName, binaryData);
    return pickup;
  } catch (e) {
    console.error(e);
  }
};
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
 * @typedef {object} Row
 * @property {number} id
 * @property {import("mongoose").ObjectId} _id
 * @property {string} rxNumber
 * @property {Date} deliveryDate
 * @property {Pickup.Relation} relation
 * @property {string} notes
 */
/**
 * @param {[Pickup]} pickups
 * @return {[Row]}
 */
const mapSearchResults = (pickups) => {
  const mappedResults = [];
  let id = 0;
  pickups.forEach((v) => {
    id += 1;
    v.rxNumber.forEach((w, i) => {
      i !== 0 && (id += 1);
      mappedResults.push({
        id,
        _id: v._id,
        rxNumber: w,
        deliveryDate: v.deliveryDate,
        relation: relationToString(v.relation),
        notes: v.notes,
        length: v.rxNumber.length,
      });
    });
  });
  return mappedResults;
};
/**
 * @param {string} [rxNumber]
 * @param {string} [date]
 * @returns {Promise<[Row]|undefined>}
 */
exports.searchPickups = async (rxNumber, date) => {
  try {
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
    return mapSearchResults(
      await Pickup.find({ $and }).sort({ deliveryDate: -1 })
    );
  } catch (e) {
    console.error(e);
  }
};
/**
 * @typedef {object} PickupReport
 * @param {string} deliveryDate
 * @param {ReturnType<relationToString>} relation
 * @param {string} notes
 */
/**
 * @param {string|Pickup|import("mongoose").ObjectId} _id
 * @param {string} rxNumber
 * @returns {Promise<PickupReport|undefined>}
 */
exports.generateReport = async (_id, rxNumber) => {
  try {
    const pickup = await Pickup.findById(_id);
    if (pickup) {
      const { deliveryDate, relation, notes } = pickup;
      return {
        deliveryDate: dayjs(deliveryDate).format("M/DD/YYYY HH:mm"),
        relation: relationToString(relation),
        notes,
      };
    }
  } catch (e) {
    console.error(e);
  }
};
