/**
 * DELIVERY STATIONS
 */
const DeliveryStation = require("../schemas/deliveryStation");

const NodeCache = require("node-cache");
// [deliveryStation.invoiceCode]: station
const nodeCache_stations = new NodeCache();
/** @type {DeliveryStation.DeliveryStationSchema[]} **/
const presets = [
  {
    displayName: "CRTP",
    name: "Crisis Residential Treatment Program",
    invoiceCode: "CTP",
    address: "8142 Sunland Blvd.",
    city: "Sun Valley",
    state: "CA",
    zip: "91352",
    phone: "(818) 582-8832",
  },
  {
    displayName: "LH Detox",
    name: "CRI-Help Inc. Lincoln Heights Detox",
    invoiceCode: "CLD",
    address: "3619 N. Mission Rd.",
    city: "Los Angeles",
    state: "CA",
    zip: "90031",
    phone: "(818) 985-8323",
  },
  {
    displayName: "LH Res",
    name: "CRI-Help Inc. Lincoln Heights Residential",
    invoiceCode: "CLR",
    address: "3619 N. Mission Rd.",
    city: "Los Angeles",
    state: "CA",
    zip: "90031",
    phone: "(818) 985-8323",
  },
  {
    displayName: "Pfleger Detox",
    name: "CRI-Help Inc. Pfleger Detox",
    invoiceCode: "CPD",
    address: "11027 Burbank Blvd.",
    city: "North Hollywood",
    state: "CA",
    zip: "91605",
    phone: "(818) 761-1652",
  },
  {
    displayName: "Pfleger Res",
    name: "CRI-Help Inc. Pfleger Residential",
    invoiceCode: "CPR",
    address: "11027 Burbank Blvd.",
    city: "North Hollywood",
    state: "CA",
    zip: "91605",
    phone: "(818) 985-8323",
  },
  {
    displayName: "Socorro Detox",
    name: "CRI-Help Inc. Socorro Detox",
    invoiceCode: "CSD",
    address: "4445 Burns Ave.",
    city: "Los Angeles",
    state: "CA",
    zip: "90029",
    phone: "(818) 985-8323",
  },
  {
    displayName: "Socorro Res",
    name: "CRI-Help Inc. Socorro Residential",
    invoiceCode: "CSR",
    address: "4445 Burns Ave.",
    city: "Los Angeles",
    state: "CA",
    zip: "90029",
    phone: "(818) 985-8323",
  },
  {
    displayName: "Teen Project",
    name: "The Teen Project",
    invoiceCode: "TTP",
    address: "14530 Sylvan St.",
    city: "Van Nuys",
    state: "CA",
    zip: "91411",
    phone: "(818) 582-8839",
  },
];

/**
 * @param {DeliveryStation.DeliveryStationSchema} schema
 * @returns {Proimse<void>}
 */
exports.createDeliveryStation = async (schema) => {
  if (!schema) {
    throw { status: 400 };
  }
  const station = await DeliveryStation.create(schema);
  nodeCache_stations.set(station.invoiceCode, station);
};

/**
 * @param {DeliveryStation.DeliveryStation[]} [stations]
 * @returns {Promise<void>}
 */
exports.handleSyncReq = async (stations) => {
  var stations = stations || (await DeliveryStation.find());
  await require("../rabbitmq")(
    "init_station_sync",
    JSON.stringify(
      stations.map((s) => ({
        code: s.invoiceCode,
        name: s.name,
        address: s.address,
        city: s.city,
        state: s.state,
        zip: s.zip,
        phone: s.phone,
      }))
    )
  );
};

/**
 * @param {string} invoiceCode
 * @returns {DeliveryStation.DeliveryStation}
 */
exports.getDeliveryStation = (invoiceCode) => {
  if (!invoiceCode) {
    throw { status: 400 };
  }
  const cache = nodeCache_stations.get(invoiceCode);
  if (cache) {
    return cache;
  } else {
    throw { status: 404 };
  }
};

/**
 * @returns {{displayName: string, invoiceCode: string, name: string}[]}
 */
exports.getActiveDeliveryStations = () => {
  return nodeCache_stations.keys().map((key) => {
    const s = nodeCache_stations.get(key);
    return {
      displayName: s.displayName,
      invoiceCode: s.invoiceCode,
      name: s.name,
    };
  });
};

/**
 * @returns {Promise<DeliveryStation.DeliveryStationSchema[]>}
 */
exports.findAllDeliveryStations = async () => {
  return (await DeliveryStation.find()).map((s) => ({
    displayName: s.displayName,
    invoiceCode: s.invoiceCode,
    active: s.active,
    name: s.name,
    address: s.address,
    city: s.city,
    state: s.state,
    zip: s.zip,
    phone: s.phone,
  }));
};

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
 * @returns {Promise<DeliveryLog.DeliveryLog|DeliveryLog.DeliveryLog[]>}
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

const { findDRxesOnStage } = require("./dRx/dRx");
const NodeCache = require("node-cache");
let today = dayjs();
// [deliveryStation._id]: DeliveryRow[]
const nodeCache_delivery_stages = new NodeCache();

/**
 * @param {string|import("mongoose").ObjectId} station
 * @returns {Promise<boolean>}
 */
exports.refresh_nodeCache_delivery_stages = async (station) =>
  nodeCache_delivery_stages.set(
    station.toString(),
    await findDRxesOnStage(station)
  );

/**
 * @param {string|import("mongoose").ObjectId} station
 * @returns {DeliveryRow[]}
 */
exports.getDeliveriesOnStage = (station) =>
  nodeCache_delivery_stages.get(station.toString());

/**
 * INITIALIZE
 */
(async function () {
  let stations = await DeliveryStation.find();
  if (stations.length === 0) {
    for (let i = 0; i < presets.length; i++) {
      await exports.createDeliveryStation(presets[i]);
    }
  } else {
    for (let i = 0; i < stations.length; i++) {
      const station = stations[i];
      const { active, invoiceCode } = station;
      active && nodeCache_stations.set(invoiceCode, station);
    }
  }
  const activeStationKeys = nodeCache_delivery_stages.keys();
  for (let i = 0; i < activeStationKeys.length; i++) {
    await exports.refresh_nodeCache_delivery_stages(
      nodeCache_delivery_stages.get(activeStationKeys[i])._id
    );
  }
  // sync RabbitMQ
  await exports.handleSyncReq(stations.length > 0 ? stations : undefined);
})();
