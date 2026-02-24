const mongoose = require("mongoose");
const DeliveryStation = require("../schemas/deliveryStation");
const DeliveryLog = require("../schemas/deliveryLog");
const DRx = require("../schemas/dRx/dRx");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);
const NodeCache = require("node-cache");

/**
 * DELIVERY STATIONS
 */

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
      })),
    ),
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

/**
 * DELIVERY LOGS
 */

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
 * @param {import("../schemas/dRx/dRx").DRx[]} dRxes
 * @returns {DeliveryRow[]}
 */
exports.deliveryRows = (dRxes) =>
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
    log: dRx.deliveryLog ? dRx.deliveryLog._id : undefined,
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
 * @param {import("../schemas/dRx/dRx").DRx[]} dRxes
 * @return {SearchResultRow[]>}
 */
exports.searchResultRows = (dRxes) =>
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

// [deliveryStation._id]: DRx[]
const nodeCache_delivery_stages = new NodeCache();
/**
 * @param {string|import("mongoose").ObjectId} station
 * @returns {Promise<DRx.DRx[]>}
 */
exports.refresh_nodeCache_delivery_stages = async (station) => {
  const dRxes = await findDRxesOnStage(station);
  nodeCache_delivery_stages.set(station.toString(), dRxes);
  return dRxes;
};

// [`${deliveryStation.invoiceCode} + ${deliveryLog.session}`]: DRx[]
const nodeCache_delivery_today_sessions = new NodeCache();
/**
 * @param {string} invoiceCode
 * @param {string} session
 * @returns {DRx.DRx[]}
 */
const get_nodeCache_delivery_today_sessions = (invoiceCode, session) =>
  nodeCache_delivery_today_sessions.get(invoiceCode + session);
/**
 * @param {string} invoiceCode
 * @param {string} session
 * @returns {Promise<DRx.DRx[]>}
 */
exports.refresh_nodeCache_delivery_today_sessions = async (
  invoiceCode,
  session,
) => {
  const station = exports.getDeliveryStation(invoiceCode);
  const log = await DeliveryLog.findOne({
    station,
    date: dayjs().format("MMDDYYYY"),
    session,
  });
  if (!log) throw { status: 404 };
  await populate(log);
  nodeCache_delivery_today_sessions.set(invoiceCode + session, log.dRxes);
  return log.dRxes;
};

/**
 * @param {string} mmddyyyy
 * @param {DeliveryStation.DeliveryStation} station
 * @param {"0" | (string & {})} session
 * @returns {Promise<DRx.DRx[]>}
 */
exports.findDeliveries = async (mmddyyyy, station, session) => {
  if (!(mmddyyyy && station && session)) {
    throw { status: 400 };
  }
  const day = dayjs(mmddyyyy, "MMDDYYYY");
  let deliveries;
  if (day.isSame(dayjs(), "d")) {
    if (session === "0") {
      const cache = nodeCache_delivery_stages.get(station._id.toString());
      if (!cache) {
        return await exports.refresh_nodeCache_delivery_stages(station._id);
      }
      return cache;
    } else {
      return (
        get_nodeCache_delivery_today_sessions(station.invoiceCode, session) ||
        []
      );
    }
  } else {
    if (session === "0") {
      return await findDRxesOnStage(station._id, day);
    } else {
      const log = await DeliveryLog.findOne({
        date: mmddyyyy,
        station,
        session,
      });
      if (!log) {
        return [];
      } else {
        await populate(log);
        return log.dRxes;
      }
    }
  }
};

/**
 * @param {DeliveryStation.DeliveryStation} station
 * @returns {Promise<DeliveryLog.DeliveryLog>}
 */
exports.createDeliveryLog = async (station) => {
  /** @type {DRx.DRx[]}  **/
  const dRxes = nodeCache_delivery_stages.get(station._id.toString());
  if (dRxes.length === 0) {
    throw { status: 404 };
  }
  let due = 0;
  dRxes.forEach((dRx) => {
    due += Number(dRx.patPay || 0);
  });
  due = due ? due.toFixed(2).toString() : "0";
  const day = dayjs();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // WARNING: to pass a `session` to `Model.create()` in Mongoose, you **must** pass an array as the first argument.
    const log = (
      await DeliveryLog.create(
        [
          {
            date: day.format("MMDDYYYY"),
            station,
            session: day.format("h:m:ss A"),
            dRxes,
            due,
          },
        ],
        { session },
      )
    )[0];
    for (let i = 0; i < dRxes.length; i++) {
      const { _id, __v } = dRxes[i];
      const updated = await DRx.findOneAndUpdate(
        { _id, __v },
        { $set: { deliveryLog: log._id }, $inc: { __v: 1 } },
        { session },
      );
      if (!updated) {
        throw { status: 409 };
      }
    }
    await session.commitTransaction();
    // check document versions are increased
    const populated = await populate(log);
    nodeCache_delivery_today_sessions.set(
      station.invoiceCode + log.session,
      populated.dRxes,
    );
    exports.refresh_nodeCache_delivery_stages(station._id);
    return log;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

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
  const activeStationKeys = nodeCache_stations.keys();
  for (let i = 0; i < activeStationKeys.length; i++) {
    const station = nodeCache_stations.get(activeStationKeys[i]);
    await exports.refresh_nodeCache_delivery_stages(station._id);
    const logs = await DeliveryLog.find({
      date: dayjs().format("MMDDYYYY"),
      station: station,
    });
    if (logs.length > 0) {
      await populate(logs);
      logs.forEach((log) =>
        nodeCache_delivery_today_sessions.set(
          station.invoiceCode + log.session,
          log.dRxes,
        ),
      );
    }
  }
  // sync RabbitMQ
  await exports.handleSyncReq(stations.length > 0 ? stations : undefined);
  require("node-schedule").scheduleJob(
    "0 0 * * *",
    nodeCache_delivery_stages.flushAll,
  );
})();
