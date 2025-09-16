const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const patientSchema = new Schema({
  patientID: { type: String, required: true, unique: true },
  patientFirstName: String,
  patientLastName: String,
  patientDOB: String,
  patientSex: String,
  patientStreet: String,
  patientCity: String,
  patientState: String,
  patientZip: String,
  patientPhone: String,
  patientSSN: String,
  patNotes: String,

  // extends
  //   lastLocation: { type: ObjectId, ref: "Facility" },
});

const model = mongoose.model("DRx Patient", patientSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DRxPatient
 */

module.exports = model;
