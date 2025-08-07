const FacilityGroup = require("../../schemas/apps/facilityGroup");

/**
 * @typedef {FacilityGroup.FacilityGroup} FacilityGroup
 * @typedef {import('../../schemas/apps/facility').Facility} Facility
 * @typedef {typeof FacilityGroup.schema} FacilityGroupObj
 */

const preset = {
  name: "Private",
};

/**
 * @param {string} name
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.createFacilityGroup = async (name) => {
  try {
    return await FacilityGroup.create({ name });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} name
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.findFacilityGroup = async (name) => {
  try {
    return await FacilityGroup.findOne({ name });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @returns {Promise<[FacilityGroup]|undefined>}
 */
exports.getFacilityGroups = async () => {
  try {
    return await FacilityGroup.find({});
  } catch (e) {
    console.error(e);
  }
};

/**
 * @returns {Promise<undefined>}
 */
exports.createPreset = async () => {
  try {
    const groups = await exports.getFacilityGroups();
    if (groups.length === 0) {
      await FacilityGroup.create(preset);
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {string} _id
 * @param {string} name
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.updateName = async (_id, name) => {
  try {
    return await FacilityGroup.findByIdAndUpdate(
      _id,
      { $set: { name } },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {string} _id
 * @param {Facility} facility
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.addFacility = async (_id, facility) => {
  try {
    return await FacilityGroup.findByIdAndUpdate(
      _id,
      { $addToSet: { facilities: facility._id } },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {string} _id
 * @param {Facility} facility
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.pullFacility = async (_id, facility) => {
  try {
    return await FacilityGroup.findByIdAndUpdate(
      _id,
      { $pull: { facilities: facility._id } },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};
