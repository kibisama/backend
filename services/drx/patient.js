const Patient = require("../../schemas/drx/patient");

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
 * @param {Patient.DRxPatientSchema} ptSchema
 * @returns {Promise<Patient.DRxPatient>}
 */
exports.upsertPatient = async (ptSchema) => {
  const { patientID } = ptSchema;
  if (!patientID) {
    throw { status: 400 };
  }
  return await Patient.findOneAndUpdate(
    { patientID },
    { $set: ptSchema },
    { runValidators: true, new: true, upsert: true }
  );
};

/**
 * @param {string} query LastInit,FirstInit
 * @returns {Promise<{_id: ObjectId, label: string, dob: string}[]>}
 */
exports.findPatient = async (query) => {
  const [last, first] = query.split(",").map((v) => v.trim());
  const $and = [];
  last && $and.push({ patientLastName: { $regex: `^${last}`, $options: "i" } });
  first &&
    $and.push({ patientFirstName: { $regex: `^${first}`, $options: "i" } });
  return (await Pt.find({ $and })).map((v) => ({
    _id: v._id,
    label: v.patientLastName + "," + v.patientFirstName,
    dob: v.patientDOB || "",
  }));
};
