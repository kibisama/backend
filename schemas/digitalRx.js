const mongoose = require("mongoose");
const { Schema } = mongoose;

const digitalRxSchema = new Schema({
  rxNumber: { type: String, reqruied: true },
  rxDate: { type: Date, reqruied: true },
  patientName: { type: String, reqruied: true },
  doctorName: { type: String, reqruied: true },
  drugName: { type: String, reqruied: true },
  rxQty: { type: String, reqruied: true },
  refills: { type: Number, reqruied: true },
  patPay: String,
  insPaid: String,
  planName: String,
  drugDEA: String,
  drugNDC: { type: String, reqruied: true },
  ansiBin: String,
  doctorNPI: String,
  doctorDEA: String,
  fillNo: Number,
  rxDateWritten: { type: Date, reqruied: true },
  paientSSN: String,
  sig: String,
  lastUpdatedBy: String,
  patientDOB: { type: Date, reqruied: true },
  patientStreet: String,
  patientZip: String,
  cardNumber: String,
  groupNumber: String,
  daysSupply: Number,
  genericFor: String,
  deliveredDate: Date,
  dispFeePaid: String,
  patientPhone: String,
  rxOrigCode: String,
  createdby: String,
  daw: String,
  pcn: String,
  rxID: String,
  qtyRemaining: String,
  effectiveDate: Date,
  qtyWritten: String,
  rxStatus: String,
  patientID: String,
  rxNotes: String,
  patientSex: String,
  rxStatusFin: String,
  totalPaid: String,
  nextFillDate: Date,
  drugRxOTC: String,
  qty: String,
  rxStatusWF: String,
  planID: String,
  GenericFor: String,
  bG: String,
  patNotes: String,
  expDate: Date,
  createdDate: Date,
});

const model = mongoose.model("Digital Rx", digitalRxSchema);
/**
 * @typedef {Awaited<ReturnType<model["create"]>>[0]} DigitalRx
 * @typedef {"DC-FILEONLY"|"DISCONTINUED"|"FILEONLY"|"FO-TRANSFERRED"|"FUTURE BILL"|"RENEWED"|"TRANSFERRED"|"TYPED"} RxStatus
 * @typedef {"BILLED"|"CASH"|"NOT BILLED"|"REJECTED"|"REVERSED"} RxStatusFin
 * @typedef {"OTC"|"RX"} DrugRxOTC
 * @typedef {"DC-FILEONLY"|"DISCONTINUED"|"FILEONLY"|"FO-TRANSFERRED"|"FUTURE BILL"|"RENEWED"|"TRANSFERRED"|"TYPED"} RxStatusWF
 * @typedef {"Brand"|"Generic"} BG
 */

module.exports = model;
