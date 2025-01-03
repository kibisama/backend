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
  form: [String],
  origQty: [Number],
  orderQty: [Number],
  shipQty: [Number],
  omitCode: [String],
  // Note: Currency stored as strings
  cost: [String],
  totalShipped: Number,
  totalAmount: String,
  isCSOSReported: { type: Boolean, default: false },
});

module.exports = mongoose.model("Cardinal Invoice", cardinalInvoiceSchema);
