const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const deliveryStationSchema = new Schema({
  id: { type: String, required: true, uppercase: true, unique: true },
  name: { type: String, required: true },
  displayName: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  plan: { type: ObjectId, ref: "DRx Plan" },
});

const model = mongoose.model("Delivery Station", deliveryStationSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DeliveryStation
 */

module.exports = model;
