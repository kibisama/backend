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
 * @param {string} oldName
 * @param {string} newName
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.updateName = async (oldName, newName) => {
  try {
    return await FacilityGroup.findOneAndUpdate(
      { name: oldName },
      { $set: { name: newName } },
      { new: true }
    );
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {FacilityGroup} group
 * @param {Facility} facility
 * @returns {Promise<undefined>}
 */
exports.addFacility = (group, facility) => {
  try {
    group.updateOne({ $addToSet: { facilities: facility._id } });
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {FacilityGroup} group
 * @param {Facility} facility
 * @returns {Promise<undefined>}
 */
exports.pullFacility = (group, facility) => {
  try {
    group.updateOne({ $pull: { facilities: facility._id } });
  } catch (e) {
    console.error(e);
  }
};
