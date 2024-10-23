const mongoose = require("mongoose");
const { Schema } = mongoose;

const cardinalInvoiceSchema = new Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: Date,
  orderNumber: String,
  orderDate: Date,
  poNumber: String,
  invoiceType: String,
  item: [String],
  cin: [String],
  tradeName: [String],
  origQty: [Number],
  orderQty: [Number],
  shipQty: [Number],
  omitCode: [String],
  cost: [Number],
  confirmNumber: [String],
  totalShipped: Number,
  totalAmount: Number,
  checkStatus: { type: String, default: "unchecked" },
  isCSOSReported: { type: Boolean, default: false },
});

module.exports = mongoose.model("Cardinal Invoice", cardinalInvoiceSchema);
