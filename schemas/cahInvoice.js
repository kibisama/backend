const mongoose = require("mongoose");
const { Schema } = mongoose;
const {
  Types: { ObjectId },
} = Schema;

const cahInvoiceSchema = new Schema({
  lastUpdated: { type: Date, required: true },
  isCSOSReported: Boolean,

  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: {
    type: String, // MM/DD/YYYY
    required: true,
  },
  orderDate: Date,
  confirmationNumber: String,
  poNumber: String,
  orderMethod: String,
  item: [
    {
      cahProduct: {
        type: ObjectId,
        ref: "Cardinal Product",
      },
      orderQty: Number,
      shipQty: Number,
      cost: String,
      omitReason: String,
    },
  ],
  totalShipped: Number,
  totalCost: String,
});

const model = mongoose.model("Cardinal Invoice", cahInvoiceSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} CAHInvoice
 * @typedef {string|CAHNoData} CAHData
 * @typedef {"— —"} CAHNoData
 * @typedef {"Invoice"|"Credit"} InvoiceType
 * @typedef {"VantusHQ Web Order"|"SFDC"} OrderMethod
 * @typedef {""|CAHNoData} OmitReason
 */
module.exports = model;
