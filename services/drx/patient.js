const Pt = require("../../schemas/dRx/patient");

/**
 * @typedef {Pt.DRxPatient} DRxPt
 * @typedef {typeof Pt.schema.obj} DRxPtSchema
 */

exports.map_fields = {
  PatientID: "patientID",
  PatientFirstName: "patientFirstName",
  PatientLastName: "patientLastName",
  PatientDOB: "patientDOB",
  PatientSex: "patientSex",
  PatientStreet: "patientStreet",
  PatientCity: "patientCity",
  PatientState: "patientState",
  PatientZip: "patientZip",
  patientPhone: "patientPhone",
  PaientSSN: "patientSSN",
  PatNotes: "patNotes",
};

/**
 * @param {DRxPtSchema} ptSchema
 * @returns {Promise<DRxPt|undefined>}
 */
exports.upsertPatient = async (ptSchema) => {
  try {
    const { patientID } = ptSchema;
    if (!patientID) {
      return;
    }
    return await Pt.findOneAndUpdate(
      { patientID },
      { $set: ptSchema },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};
