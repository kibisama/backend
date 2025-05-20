const PT = require("../../schemas/drx/patient");

/**
 * @typedef {PT.Patient} Patient
 * @typedef {typeof PT.schema.obj} PtObj
 */

/**
 * @param {PtObj} patient
 * @return {{patientID: string}}
 */
const createBase = (patient) => {
  return { patientID: patient.patientID };
};

module.exports = {
  /**
   * Upserts (or updates if exists) a Patient document.
   * @param {PtObj} patient
   * @returns {Promise<Patient|undefined>}
   */
  async upsertPt(patient) {
    try {
      const base = createBase(patient);
      const pt = await PT.findOne(base);
      if (pt === null) {
        return await PT.create(patient);
      }
      return await PT.findByIdAndUpdate(pt._id, patient, { new: true });
    } catch (e) {
      console.log(e);
    }
  },
};
