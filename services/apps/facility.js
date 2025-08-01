const Facility = require("../../schemas/apps/facility");

/**
 * @typedef {Facility.Facility} Facility
 * @typedef {typeof Facility.schema.obj} FacilityObj
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
