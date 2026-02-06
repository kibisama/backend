const mongoose = require("mongoose");
const { Schema } = mongoose;

const patientSchema = new Schema({
  patientID: { type: String, required: true, unique: true },
  patientFirstName: { type: String, required: true },
  patientLastName: { type: String, required: true },
  patientDOB: String,
  patientSex: String,
  patientStreet: String,
  patientCity: String,
  patientState: String,
  patientZip: String,
  patientPhone: String,
  patientSSN: String,
  patNotes: String,
});

const model = mongoose.model("DRx Patient", patientSchema);
/**
 * @typedef {object} DRxPatientSchema
 * @property {string} patientID
 * @property {string} patientFirstName
 * @property {string} patientLastName
 * @property {string} [patientDOB]
 * @property {string} [patientSex]
 * @property {string} [patientStreet]
 * @property {string} [patientCity]
 * @property {string} [patientState]
 * @property {string} [patientZip]
 * @property {string} [patientPhone]
 * @property {string} [patientSSN]
 * @property {string} [patNotes]
 * @typedef {mongoose.HydratedDocument<DRxPatientSchema>} DRxPatient
 */

module.exports = model;
