const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const deliveryStationSchema = new Schema({
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
  group: { type: ObjectId, ref: "Delivery Group" },
  plan: { type: ObjectId, ref: "DRx Plan" },
});

const model = mongoose.model("Delivery Station", deliveryStationSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DeliveryStation
 */

module.exports = model;
