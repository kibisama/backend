const Facility = require("../../schemas/apps/facility");
const FacilityGroup = require("../../schemas/apps/facilityGroup");

/**
 * @typedef {Facility.Facility} Facility
 * @typedef {typeof Facility.schema.obj} FacilityObj
 * @typedef {typeof FacilityGroup.schema} FacilityGroupObj
 */

/**
 * @param {string} name
 * @returns {Promise<Facility|null|undefined>}
 */
exports.findFacility = async (name) => {
  try {
    return await Facility.findOne({ name });
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} name
 * @param {FacilityObj} obj
 * @returns {Promise<Facility|undefined>}
 */
exports.upsertFacility = async (name, obj) => {
  try {
    return await Facility.findOneAndUpdate(
      { name },
      { $set: obj },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} name
 * @param {FacilityGroupObj} obj
 * @returns {Promise<FacilityGroup|undefined>}
 */
exports.upsertFacilityGroup = async (name, obj) => {
  try {
    return await FacilityGroup.findOneAndUpdate(
      { name },
      { $set: obj },
      { new: true, upsert: true }
    );
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
