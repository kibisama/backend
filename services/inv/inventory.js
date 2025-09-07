const dayjs = require("dayjs");
const item = require("./item");
const package = require("./package");
const alt = require("./alternative");

exports.getAlternatives = async () => {
  return (await alt.getAllDocuments()).map((v) => ({
    label: v.name || v.defaultName,
    _id: v._id,
  }));
};

/**
 * @typedef {package.Package} Package
 *
 * @typedef {object} Row
 * @property {boolean} [label]
 * @property {number} id
 * @property {import("mongoose").ObjectId} _id
 * @property {string} lot
 * @property {Date} exp
 * @property {string} [source]
 * @property {string} [cost]
 * @property {Date} [dateFilled]
 * @property {Date} [dateReceived]
 */
/**
 * @param {Package} pkg populated inventories
 * @returns {string}
 */
const getRowLabel = (pkg) => {
  const mfrName = pkg.mfrName || pkg.mfr;
  return `${
    (mfrName ? mfrName : "") +
    (pkg.gtin ? ` | GTIN ${pkg.gtin}` : "") +
    (pkg.ndc11 ? ` | NDC ${pkg.ndc11}` : "") +
    (pkg.size ? ` | SIZE ${pkg.size}` : "")
  }`;
};
/**
 * @param {[alt.Package]} packages populated inventories
 * @returns {{rows: [Row], count: number}}
 */
const mapInventoryRows = (packages) => {
  /** @type {[Row]} */
  const rows = [];
  let count = 0;
  let id = 0;
  packages.forEach((pkg) => {
    if (pkg.inventories.length > 0) {
      id += 1;
      rows.push({ label: true, _id: pkg._id, id, lot: getRowLabel(pkg) });
      pkg.inventories.forEach((item) => {
        id += 1;
        count += 1;
        rows.push({
          _id: item._id,
          id,
          gtin: item.gtin,
          lot: item.lot,
          sn: item.sn,
          exp: item.exp,
          source: item.source,
          cost: item.cost,
          dateFilled: item.dateFilled,
          dateReceived: item.dateReceived,
          invoiceRef: item.invoiceRef,
        });
      });
      id += 1;
      rows.push({
        label: true,
        _id: pkg._id,
        id,
        lot: `Total ${count} item(s)`,
      });
      count = 0;
    }
  });
  return rows;
};
/**
 * @param {string|ObjectId} _id
 * @param {boolean} filled
 */
exports.getInventories = async (_id, filled) => {
  const packages = await alt.getPackagesWithInventories(_id, {
    dateReceived: -1,
  });
  if (packages?.length > 0) {
    if (filled) {
      for (let i = 0; i < packages.length; i++) {
        const { gtin } = packages[i];
        if (!gtin) {
          continue;
        }
        packages[i].inventories = await item.findItemsByGTIN(gtin, {
          dateReceived: -1,
        });
        await packages[i].populate({ path: "inventories" });
      }
    }
    return mapInventoryRows(packages);
  }
};

/**
 * @param {[item.Item]} items
 * @returns {}
 */
const mapUsageRows = async (items) => {
  const rows = [];
  const table = {};
  let id = 0;
  for (let i = 0; i < items.length; i++) {
    const { gtin, dateFilled } = items[i];
    if (!table[gtin]) {
      id += 1;
      table[gtin] = { id, time: dateFilled, qty: 1 };
      const row = table[gtin];
      rows.push(row);
      const pkg = await package.findPackageByGTIN(gtin);
      if (pkg) {
        await pkg.populate([
          { path: "cahProduct" },
          { path: "alternative", populate: [{ path: "cahProduct" }] },
        ]);
        const { name, alternative, cahProduct } = pkg;
        if (cahProduct) {
          const { estNetCost, netUoiCost } = cahProduct;
          row.cah_estNetCost = estNetCost;
          row.cah_netUoiCost = netUoiCost;
        }
        row.name = name || alternative?.name || alternative?.defaultName;
        const { cahProduct: cahSource } = alternative;
      }
    } else {
      table[gtin].qty += 1;
    }
  }
  return rows;
};

/** Caching today's usage **/
let __invUsageToday;
/**
 * @param {string} date
 */
exports.getUsages = async (date) => {
  // if date is today use cache else map a new array
  const day = typeof date === "string" ? dayjs(date, "MMDDYYYY") : dayjs(date);
  if (day.isSame(dayjs(), "d")) {
    return (
      __invUsageToday ||
      (__invUsageToday = await mapUsageRows(await item.findItemsByFilledDate()))
    );
  }
  return await mapUsageRows(await item.findItemsByFilledDate(date));
};
