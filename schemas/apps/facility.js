const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const facilityGroupSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  employees: [
    { lastName: String, firstName: String, email: String, patientID: String },
  ],
  facilityGroup: { type: ObjectId, ref: "Facility Group" },
  plan: { type: ObjectId, ref: "DRx Plan", unique: true },
});

const model = mongoose.model("Facility", facilityGroupSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Facility
 */

module.exports = model;
