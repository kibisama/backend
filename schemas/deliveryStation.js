const mongoose = require("mongoose");
const { Schema } = mongoose;

const deliveryStationSchema = new Schema({
  displayName: { type: String, required: true, unique: true },
  invoiceCode: {
    type: String,
    required: true,
    unique: true,
    minLength: 3,
    maxLength: 3,
  },
  active: { type: Boolean, required: true, default: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true },
  phone: { type: String, required: true },
});

const model = mongoose.model("Delivery Station", deliveryStationSchema);
/**
 * @typedef {object} DeliveryStationSchema
 * @property {string} displayName
 * @property {string} invoiceCode
 * @property {boolean} [active]
 * @property {string} name
 * @property {string} address
 * @property {string} city
 * @property {string} state
 * @property {string} zip
 * @property {string} phone
 * @typedef {mongoose.HydratedDocument<DeliveryStationSchema>} DeliveryStation
 */

module.exports = model;
