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
  tradeName: [String],
  origQty: [String],
  orderQty: [String],
  shipQty: [String],
  omitCode: [String],
  cost: [String],
  confirmNumber: [String],
  totalShipped: String,
  totalAmount: String,

  checkStatus: String,
  isCSOSReported: Boolean,
});

module.exports = mongoose.model("Cardinal Invoice", cardinalInvoiceSchema);
