const DeliveryStation = require("../../schemas/apps/deliveryStation");

/**
 * @typedef {DeliveryStation.DeliveryStation} DeliveryStation
 * @typedef {typeof DeliveryStation.schema.obj} DeliveryStationSchema
 * @typedef {import("mongoose").ObjectId} ObjectId
 */

const reserved = ["PRIVATE", "MANAGE GROUPS"];
/** @type {[DeliveryStationSchema]} **/
const presets = [
  {
    displayName: "CRI Detox",
    name: "CRI-Help Inc. Pfleger Detox",
    invoiceCode: "CPD",
    address: "11027 Burbank Blvd.",
    city: "North Hollywood",
    state: "CA",
    zip: "91605",
    phone: "(818) 761-1652",
  },
  {
    displayName: "CRI Res",
    name: "CRI-Help Inc. Pfleger Residential",
    invoiceCode: "CPR",
    address: "11027 Burbank Blvd.",
    city: "North Hollywood",
    state: "CA",
    zip: "91605",
    phone: "(818) 761-1652",
  },
  {
    displayName: "CRTP",
    name: "Crisis Residential Treatment Program",
    invoiceCode: "CTP",
    address: "8142 Sunland Blvd.",
    city: "Sun Valley",
    state: "CA",
    zip: "91352",
    phone: "(818) 582-8832",
  },
];

let __allDeliveryStations;

/**
 * @returns {Promise<[DeliveryStation]|undefined>}
 */
exports.getAllDeliveryStations = async () => {
  try {
    if (!__allDeliveryStations) {
      let stations = await DeliveryStation.find({}).sort({ displayName: 1 });
      if (stations.length === 0) {
        await createPresets();
        stations = await DeliveryStation.find({}).sort({ displayName: 1 });
      }
      __allDeliveryStations = stations;
    }
    return __allDeliveryStations;
  } catch (e) {
    console.error(e);
  }
};

const createPresets = async () => {
  try {
    for (let i = 0; i < presets.length; i++) {
      await exports.createDeliveryStation(presets[i]);
    }
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
 * @param {string|ObjectId} _id
 * @returns {Promise<DeliveryStation|undefined>}
 */
exports.findDeliveryStation = async (_id) => {
  try {
    return await DeliveryStation.findById(_id);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string|ObjectId} _id
 * @param {DeliveryStationSchema} schema
 * @returns {Promise<DeliveryGroup|undefined>}
 */
exports.updateDeliveryStation = async (_id, schema) => {
  try {
    return await DeliveryStation.findByIdAndUpdate(
      _id,
      { $set: schema },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};
