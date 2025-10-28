const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const invoiceSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  dateCreated: {
    type: Date,
    required: true,
    default: Date.now,
  },
  datePeriodStart: Date,
  datePeriodEnd: Date,
  dateDue: Date,
  station: {
    type: ObjectId,
    ref: "Delivery Station",
  },
  billingAddress: { type: String, required: true },
  billingCity: { type: String, required: true },
  billingState: { type: String, required: true },
  billingZip: { type: String, required: true },
  billingPhone: { type: String, required: true },
  dRxes: {
    type: [{ type: ObjectId, ref: "DRx Rx" }],
  },
  extraItems: {
    type: [{ desription: String, due: String }],
  },
  paid: { type: Boolean, default: false },
  due: String,
});
const model = mongoose.model("Invoice", invoiceSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} Invoice
 */

module.exports = model;
