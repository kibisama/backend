const DeliveryStation = require("../../schemas/apps/deliveryStation");
const DeliveryLog = require("../../schemas/apps/deliveryLog");
const dayjs = require("dayjs");

/**
 * @typedef {DeliveryStation.DeliveryStation} DeliveryStation
 * @typedef {typeof DeliveryStation.schema.obj} DeliveryStationSchema
 * @typedef {DeliveryLog.DeliveryLog} DeliveryLog
 * @typedef {typeof DeliveryLog.schema.obj} DeliveryLogSchema
 * @typedef {import("../drx/dRx").DRx} DRx
 * @typedef {import("mongoose").ObjectId} ObjectId
 */

const reserved = ["PRIVATE", "MANAGE GROUPS"];
/** @type {[DeliveryStationSchema]} **/
const presets = [
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
    displayName: "Teen Project",
    name: "The Teen Project",
    invoiceCode: "TTP",
    address: "14530 Sylvan St.",
    city: "Van Nuys",
    state: "CA",
    zip: "91411",
    phone: "(818) 582-8839",
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
    displayName: "Socorro Detox",
    name: "CRI-Help Inc. Socorro Detox",
    invoiceCode: "CSD",
    address: "4445 Burns Ave.",
    city: "Los Angeles",
    state: "CA",
    zip: "90029",
    phone: "(818) 761-1652",
  },
];

let __allDeliveryStations = [];
(async function () {
  try {
    let stations = await DeliveryStation.find({}).sort({ displayName: 1 });
    if (stations.length === 0) {
      await createPresets();
      stations = await DeliveryStation.find({}).sort({ displayName: 1 });
    }
    __allDeliveryStations = stations;
  } catch (e) {
    console.error(e);
  }
})();

/**
 * @param {string} arg
 * @param {"displayName"|"invoiceCode"|"id"} type
 * @returns {ObjectId|undefined}
 */
exports.getDeliveryStationId = (arg, type) => {
  for (let i = 0; i < __allDeliveryStations.length; i++) {
    const station = __allDeliveryStations[i];
    if (station[type] === arg) {
      return station._id;
    }
  }
};

/**
 * @param {true} refresh
 * @returns {Promise<[DeliveryStation]|undefined>}
 */
exports.getAllDeliveryStations = async (refresh) => {
  try {
    if (refresh) {
      __allDeliveryStations = await DeliveryStation.find({}).sort({
        displayName: 1,
      });
    }
    return __allDeliveryStations;
  } catch (e) {
    console.error(e);
  }
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
 * @returns {Promise<DeliveryStation|import("../common").Response|undefined>}
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
    exports.getAllDeliveryStations(true);
    return station;
  } catch (e) {
    console.error(e);
  }
};

let __DeliveryLogsToday = { date: dayjs().format("MMDDYYYY") };
/**
 * @param {string} date
 * @param {string} stationId
 * @returns {Promise<[DeliveryLog]|undefined>}
 */
exports.findDeliveryLog = async (date, station) => {
  try {
    if (date === dayjs().format("MMDDYYYY")) {
      if (date === __DeliveryLogsToday.date) {
        if (!__DeliveryLogsToday[station]) {
          __DeliveryLogsToday[station] = await DeliveryLog.find({
            date,
            station,
          });
        }
      } else {
        __DeliveryLogsToday = {
          date,
          station: await DeliveryLog.find({ date, station }),
        };
      }
      return __DeliveryLogsToday[station];
    } else {
      return await DeliveryLog.find({ date, station });
    }
  } catch (e) {
    console.error(e);
  }
};
// /**
//  * @param {string|ObjectId} station
//  * @param {[DRx|ObjectId]} dRxes
//  */
// exports.createDeliveryLog = async (station, dRxes) => {
//   const date = dayjs().format("MM/DD/YYYY")
//   if (date === __DeliveryLogsToday.date ) {
//     if (__DeliveryLogsToday[station]) {

//     } else {

//     }
//   }
//   try {

//   }catch(e) {
//     console.error(e)
//   }
// }

// /**
//  * @param {string|ObjectId} _id
//  * @returns {Promise<DeliveryStation|undefined>}
//  */
// exports.findDeliveryStation = async (_id) => {
//   try {
//     return await DeliveryStation.findById(_id);
//   } catch (e) {
//     console.error(e);
//   }
// };

// /**
//  * @param {string|ObjectId} _id
//  * @param {DeliveryStationSchema} schema
//  * @returns {Promise<DeliveryGroup|undefined>}
//  */
// exports.updateDeliveryStation = async (_id, schema) => {
//   try {
//     return await DeliveryStation.findByIdAndUpdate(
//       _id,
//       { $set: schema },
//       { new: true }
//     );
//   } catch (e) {
//     console.error(e);
//   }
// };
