const DeliveryStation = require("../../schemas/apps/deliveryStation");

/**
 * @typedef {DeliveryStation.DeliveryStation} DeliveryStation
 * @typedef {typeof DeliveryStation.schema.obj} DeliveryStationSchema
 */

const reserved = ["PRIVATE"];

/**
 * @returns {Promise<[DeliveryStation]|undefined>}
 */
exports.getAllDeliveryStations = async () => {
  try {
    return await DeliveryStation.find({});
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {DeliveryStationSchema} schema
 * @returns {Promise<DeliveryStation|import("../common").Response|undefined>}
 */
exports.createDeliveryStation = async (schema) => {
  const id = schema.displayName.toUpperCase();
  if (reserved.includes(id)) {
    return {
      code: 409,
      message: `You may not use "${schema.displayName}" as a display name.`,
    };
  }
  try {
    return await DeliveryStation.create({
      ...schema,
      id,
    });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} id
 * @returns {Promise<DeliveryStation|undefined>}
 */
exports.findDeliveryStation = async (id) => {
  try {
    return await DeliveryStation.findOne({ id });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} id
 * @param {DeliveryStationSchema} schema
 * @returns {Promise<DeliveryGroup|undefined>}
 */
exports.updateDeliveryStation = async (id, schema) => {
  try {
    return await DeliveryStation.findOneAndUpdate(
      { id },
      { $set: schema },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};
