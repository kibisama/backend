const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const deliveryGroupSchema = new Schema({
  name: { type: String, required: true, unique: true },
  stations: [{ type: ObjectId, ref: "Delivery Station" }],
});

const model = mongoose.model("Delivery Group", deliveryGroupSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DeliveryGroup
 */

module.exports = model;
