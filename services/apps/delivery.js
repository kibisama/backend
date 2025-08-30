const DeliveryGroup = require("../../schemas/apps/deliveryGroup");

/**
 * @typedef {DeliveryGroup.DeliveryGroup} DeliveryGroup
 * @typedef {import('../../schemas/apps/deliveryStation').DeliveryStation} DeliveryStation
 */

const preset = {
  name: "Private",
};

/**
 * @param {string} name
 * @returns {Promise<DeliveryGroup|undefined>}
 */
exports.createDeliveryGroup = async (name) => {
  try {
    return await DeliveryGroup.create({ name });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} name
 * @returns {Promise<DeliveryGroup|undefined>}
 */
exports.findDeliveryGroup = async (name) => {
  try {
    return await DeliveryGroup.findOne({ name });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @returns {Promise<[DeliveryGroup]|undefined>}
 */
exports.getDeliveryGroups = async () => {
  try {
    return await DeliveryGroup.find({});
  } catch (e) {
    console.error(e);
  }
};

/**
 * @returns {Promise<undefined>}
 */
exports.createPreset = async () => {
  try {
    const groups = await exports.getDeliveryGroups();
    if (groups.length === 0) {
      await DeliveryGroup.create(preset);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {import("mongoose").ObjectId} _id
 * @param {string} name
 * @returns {Promise<DeliveryGroup|undefined>}
 */
exports.updateName = async (_id, name) => {
  try {
    return await DeliveryGroup.findByIdAndUpdate(
      _id,
      { $set: { name } },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};

// /**
//  * @param {string} _id
//  * @param {Facility} facility
//  * @returns {Promise<FacilityGroup|undefined>}
//  */
// exports.addFacility = async (_id, facility) => {
//   try {
//     return await FacilityGroup.findByIdAndUpdate(
//       _id,
//       { $addToSet: { facilities: facility._id } },
//       { new: true }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };
// /**
//  * @param {string} _id
//  * @param {Facility} facility
//  * @returns {Promise<FacilityGroup|undefined>}
//  */
// exports.pullFacility = async (_id, facility) => {
//   try {
//     return await FacilityGroup.findByIdAndUpdate(
//       _id,
//       { $pull: { facilities: facility._id } },
//       { new: true }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };
