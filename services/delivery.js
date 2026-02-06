const DeliveryLog = require("../schemas/deliveryLog");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

/**
 * @typedef {object} DeliveryRow
 * @property {number|string} id
 * @property {ObjectId} _id
 * @property {Date} time
 * @property {Date} rxDate
 * @property {string} rxNumber
 * @property {string} patient
 * @property {string} drugName
 * @property {string} doctorName
 * @property {string} rxQty
 * @property {string} plan
 * @property {string} patPay
 * @property {ObjectId} log
 * @property {ObjectId[]} logHistory
 * @property {Date} returnDate
 */

/**
 * @param {import("../schemas/dRx/dRx").DigitalRx[]} dRxes
 * @returns {DeliveryRow[]}
 */
const deliveryRows = (dRxes) =>
  dRxes.map((dRx) => ({
    id: dRx.rxID,
    _id: dRx._id,
    time: dRx.deliveryDate,
    rxDate: dRx.rxDate,
    rxNumber: dRx.rxNumber,
    drugName: dRx.drugName,
    doctorName: dRx.doctorName,
    rxQty: dRx.rxQty,
    patPay: dRx.patPay,
    log: dRx.deliveryLog._id,
    logHistory: dRx.logHistory || [],
    returnDate:
      dRx.returnDates?.length > 0
        ? dRx.returnDates[dRx.returnDates.length - 1]
        : undefined,
    patient: `${dRx.patient.patientLastName}, ${dRx.patient.patientFirstName}`,
    plan: dRx.plan ? dRx.plan.planName || dRx.plan.planID : undefined,
  }));

/**
 * @typedef {object} SearchResultRow
 * @property {string} id
 * @property {string} rxNumber
 * @property {Date} rxDate
 * @property {string} patient
 * @property {string} drugName
 * @property {string} stationDisplayName
 * @property {string} deliveryLogDate
 * @property {string} session
 * @property {Date} returnDate
 */

/**
 * @param {import("../schemas/dRx/dRx").DigitalRx[]} dRxes
 * @return {SearchResultRow[]>}
 */
const searchResultRows = (dRxes) =>
  dRxes.map((dRx) => ({
    id: dRx.rxID,
    rxNumber: dRx.rxNumber,
    rxDate: dRx.rxDate,
    drugName: dRx.drugName,
    returnDate:
      dRx.returnDates?.length > 0
        ? returnDates[returnDates.length - 1]
        : undefined,
    patient: `${dRx.patient.patientLastName}, ${dRx.patient.patientFirstName}`,
    stationDisplayName: dRx.deliveryStation
      ? dRx.deliveryStation.displayName
      : undefined,
    deliveryLogDate: dRx.deliveryLog
      ? dayjs(dRx.deliveryLog.date, "MMDDYYYY").format("M. D. YYYY")
      : undefined,
    session: dRx.deliveryLog ? dRx.deliveryLog.session : undefined,
  }));

/**
 * @typedef {object} Session
 * @property {string} session
 * @property {ObjectId} logId
 */

/**
 * @param {import("../schemas/deliveryLog").DeliveryLog[]} logs
 * @return {Session[]>}
 */
const sessions = (logs) =>
  logs.map((log) => ({
    session: log.session,
    logId: log._id,
  }));

/**
 * @param {string} mmddyyyy
 * @param {string|import("mongoose").ObjectId} station
 * @returns {Promise<Session[]>}
 */
exports.findDeliverySessions = async (mmddyyyy, station) => {
  return sessions(await DeliveryLog.find({ date: mmddyyyy, station }));
};

const populateOption = {
  path: "dRxes",
  select: {
    _id: 1,
    rxID: 1,
    deliveryDate: 1,
    rxDate: 1,
    rxNumber: 1,
    drugName: 1,
    doctorName: 1,
    rxQty: 1,
    patPay: 1,
    patient: 1,
    plan: 1,
    deliveryLog: 1,
    returnDates: 1,
    logHistory: 1,
  },
};
/**
 * @param {DeliveryLog.DeliveryLog|DeliveryLog.DeliveryLog[]} logs
 * @returns {DeliveryLog.DeliveryLog|DeliveryLog.DeliveryLog[]}
 */
const populate = async (logs) => {
  if (logs instanceof Array) {
    for (let i = 0; i < logs.length; i++) {
      await logs[i].populate(populateOption);
    }
  } else {
    await logs.populate(populateOption);
  }
  return logs;
};

/**
 * NodeCache
 */
const NodeCache = require("node-cache");
let today = dayjs();
// [`${deliveryStation.invoiceCode} + ${deliveryLog.session}`]: DeliveryRow[]
const nodeCache_today_deliveries = new NodeCache();
