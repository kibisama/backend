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

  // sync RabbitMQ
  await exports.handleSyncReq(stations.length > 0 ? stations : undefined);
})();

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
