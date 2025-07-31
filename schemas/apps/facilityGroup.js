const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const facilityGroupSchema = new Schema({
  name: { type: String, required: true, unique: true },
  facilities: [{ type: ObjectId, ref: "Facility" }],
});

const model = mongoose.model("Facility Group", facilityGroupSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} FacilityGroup
 */

module.exports = model;
