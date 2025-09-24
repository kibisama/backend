const DeliveryStation = require("../../schemas/apps/deliveryStation");
const DeliveryLog = require("../../schemas/apps/deliveryLog");
const DRx = require("../../schemas/dRx/dRx");
const dRx = require("../dRx/dRx");
const dayjs = require("dayjs");
const mongoose = require("mongoose");

/**
 * @typedef {DeliveryStation.DeliveryStation} DeliveryStation
 * @typedef {typeof DeliveryStation.schema.obj} DeliveryStationSchema
 * @typedef {DeliveryLog.DeliveryLog} DeliveryLog
 * @typedef {typeof DeliveryLog.schema.obj} DeliveryLogSchema
 * @typedef {dRx.DRx} DRx
 * @typedef {import("mongoose").ObjectId} ObjectId
 */

const reserved = ["PRIVATE", "MANAGE GROUPS"];
/** @type {[DeliveryStationSchema]} **/
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
    phone: "(818) 761-1652",
  },
  {
    displayName: "LH Res",
    name: "CRI-Help Inc. Lincoln Heights Residential",
    invoiceCode: "CLR",
    address: "3619 N. Mission Rd.",
    city: "Los Angeles",
    state: "CA",
    zip: "90031",
    phone: "(818) 761-1652",
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
    phone: "(818) 761-1652",
  },
  {
    displayName: "Socorro Detox",
    name: "CRI-Help Inc. Socorro Detox",
    invoiceCode: "CSD",
    address: "4445 Burns Ave.",
    city: "Los Angeles",
    state: "CA",
    zip: "90029",
    phone: "(818) 761-1652",
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
 * @param {string|ObjectId|DeliveryStation} stationId
 * @returns {Promise<void>}
 */
const setDeliveryLogsToday = async (stationId) => {
  try {
    const logs = await DeliveryLog.find(
      {
        date: __DeliveryLogsToday.date,
        station: stationId,
      },
      {},
      {
        populate: {
          path: "dRxes",
          select: {
            _id: 1,
            deliveryDate: 1,
            rxDate: 1,
            rxNumber: 1,
            drugName: 1,
            doctorName: 1,
            rxQty: 1,
            patPay: 1,
            patient: 1,
            plan: 1,
          },
        },
      }
    );
    for (let j = 0; j < logs.length; j++) {
      __DeliveryLogsToday[stationId][logs[j].session] =
        await exports.mapDeliveryLogs(logs[j].dRxes);
    }
  } catch (e) {
    console.error(e);
  }
};
/**
 * @param {string|ObjectId|DeliveryStation} stationId
 * @returns {Promise<void>}
 */
exports.setDeliveryStagesToday = async (stationId) => {
  try {
    __DeliveryLogsToday.stages[stationId] = await exports.mapDeliveryLogs(
      await dRx.findDRxByStation(stationId)
    );
  } catch (e) {
    console.error(e);
  }
};

const __allDeliveryStations = {};
let __DeliveryLogsToday = { date: dayjs().format("MMDDYYYY"), stages: {} };
(async function () {
  try {
    let stations = await DeliveryStation.find({}).sort({ displayName: 1 });
    if (stations.length === 0) {
      await createPresets();
    } else {
      for (let i = 0; i < stations.length; i++) {
        const station = stations[i];
        __allDeliveryStations[station.id] = station;
        const { _id } = station;
        __DeliveryLogsToday[_id] = {};
        await setDeliveryLogsToday(_id);
        await exports.setDeliveryStagesToday(_id);
      }
    }
  } catch (e) {
    console.error(e);
  }
})();

/**
 * @returns {Promise<[DeliveryStation]|undefined>}
 */
exports.getAllDeliveryStations = async () => {
  try {
    return Object.values(__allDeliveryStations);
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} id
 * @returns {DeliveryStation|undefined}
 */
exports.getDeliveryStation = (id) => {
  return __allDeliveryStations[id];
};

const createPresets = async () => {
  try {
    for (let i = 0; i < presets.length; i++) {
      await exports.createDeliveryStation(presets[i]);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {DeliveryStationSchema} schema
 * @returns {Promise<import("../common").Response|undefined>}
 */
exports.createDeliveryStation = async (schema) => {
  const id = schema.displayName.toUpperCase();
  if (reserved.includes(id)) {
    return {
      code: 409,
      message: `You may not use "${schema.displayName}" as a display name.`,
    };
  }
  try {
    const station = await DeliveryStation.create({
      ...schema,
      id,
    });
    __allDeliveryStations[station.id] = station;
    const { _id } = station;
    __DeliveryLogsToday[_id] = {};
    await setDeliveryLogsToday(_id);
    await exports.setDeliveryStagesToday(_id);
    return { code: 200, data: station };
  } catch (e) {
    console.error(e);
  }
};

/**
 * Refreshes __DeliveryLogsToday if expired
 * @returns {Promise<void>}
 */
const refreshLogsToday = async () => {
  try {
    const date = dayjs().format("MMDDYYYY");
    if (__DeliveryLogsToday.date !== date) {
      __DeliveryLogsToday = { date, stages: {} };
      for (const station in __allDeliveryStations) {
        const _id = __allDeliveryStations[station]._id;
        __DeliveryLogsToday[_id] = {};
        await setDeliveryLogsToday(_id);
        await exports.setDeliveryStagesToday(_id);
      }
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} date
 * @param {string} stationId
 * @returns {Promise<[string]|undefined>}
 */
exports.findDeliverySessions = async (date, stationId) => {
  try {
    if (date === dayjs().format("MMDDYYYY")) {
      await refreshLogsToday();
      return Object.keys(__DeliveryLogsToday[stationId]);
    } else {
      return (await DeliveryLog.find({ date, station: stationId })).map(
        (v) => v.session
      );
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string} date
 * @param {string} stationId
 * @param {string} session
 * @returns {Promise<[Row]|undefined>}
 */
exports.findDeliveryLogItems = async (date, stationId, session) => {
  try {
    if (date === dayjs().format("MMDDYYYY")) {
      await refreshLogsToday();
      if (session === "0") {
        return __DeliveryLogsToday.stages[stationId];
      }
      return __DeliveryLogsToday[stationId][session];
    } else {
      const log = await DeliveryLog.findOne({
        date,
        station: stationId,
        session,
      }).populate({
        path: "dRxes",
        select: {
          _id: 1,
          deliveryDate: 1,
          rxDate: 1,
          rxNumber: 1,
          drugName: 1,
          doctorName: 1,
          rxQty: 1,
          patPay: 1,
          patient: 1,
          plan: 1,
        },
      });
      if (!log) {
        return [];
      }
      return await exports.mapDeliveryLogs(log.dRxes);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * @param {string|ObjectId} station
 * @returns {Promise<DeliveryLog|undefined>}
 */
exports.createDeliveryLog = async (station) => {
  const dRxes = __DeliveryLogsToday.stages[station];
  if (dRxes.length === 0) {
    return;
  }
  const day = dayjs();
  const date = day.format("MMDDYYYY");
  const session = day.format("h:m:ss A");
  try {
    const tx = await mongoose.startSession();
    const log = await tx.withTransaction(async () => {
      try {
        const log = (
          await DeliveryLog.create([{ date, station, session, dRxes }], {
            session: tx,
          })
        )[0];
        for (let i = 0; i < dRxes.length; i++) {
          await DRx.findByIdAndUpdate(
            dRxes[i]._id,
            { $set: { deliveryLog: log._id } },
            { session: tx }
          );
        }
        __DeliveryLogsToday[station][log.session] = dRxes;
        __DeliveryLogsToday.stages[station] = [];
        return log;
      } catch (e) {
        console.error(e);
      }
    });
    tx.endSession();
    return log;
  } catch (e) {
    console.error(e);
  }
};

/**
 * @typedef {object} Row
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
 */

/**
 * @param {[DRx]} dRxes
 * @returns {Promise<[Row]|undefined>}
 */
exports.mapDeliveryLogs = async (dRxes) => {
  const rows = [];
  try {
    for (let i = 0; i < dRxes.length; i++) {
      const dRx = dRxes[i];
      await dRx.populate(["patient", "plan"]);
      /** @type {Row} **/
      const row = {
        id: i + 1,
        _id: dRx._id,
        time: dRx.deliveryDate,
        rxDate: dRx.rxDate,
        rxNumber: dRx.rxNumber,
        drugName: dRx.drugName,
        doctorName: dRx.doctorName,
        rxQty: dRx.rxQty,
        patPay: dRx.patPay,
        log: dRx.deliveryLog,
      };
      dRx.patient?.patientLastName &&
        dRx.patient.patientFirstName &&
        (row.patient = `${dRx.patient.patientLastName}, ${dRx.patient.patientFirstName}`);
      dRx.plan && (row.plan = dRx.plan.planName || dRx.plan.planID);
      rows.push(row);
    }
    return rows;
  } catch (e) {
    console.error(e);
  }
};
