const Pickup = require("../../schemas/apps/pickup");
const dayjs = require("dayjs");

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
exports.search = async (rxNumber, date) => {
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
  return mapSearchResults(await Pickup.find({ $and }));
};
/**
 * @param {string|Pickup|import("mongoose").ObjectId} _id
 * @returns {Promise<Pickup|undefined>}
 */
exports.findPickupById = async (_id) => {
  try {
    return await Pickup.findById(_id);
  } catch (e) {
    console.error(e);
  }
};
