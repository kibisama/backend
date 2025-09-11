const dayjs = require("dayjs");
const item = require("./item");
const package = require("./package");
const alt = require("./alternative");
const { interpretCAHData } = require("../cah/common");
const { stringToNumber } = require("../convert");

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
 * @param {"dateReceived"|"dateFilled"|"dateReturned"|"exp"} sort
 * @param {boolean} filled
 */
exports.getInventories = async (_id, sort, filled) => {
  var sort =
    sort === "dateReceived"
      ? { dateReceived: -1 }
      : sort === "dateFilled"
      ? { dateFilled: -1 }
      : sort === "dateReturned"
      ? { dateReturned: -1 }
      : sort === "exp"
      ? { exp: -1 }
      : {};
  const packages = await alt.getPackagesWithInventories(_id, sort);
  if (packages?.length > 0) {
    if (filled) {
      for (let i = 0; i < packages.length; i++) {
        const { gtin } = packages[i];
        if (!gtin) {
          continue;
        }
        packages[i].inventories = await item.findItemsByGTIN(gtin, sort);
        await packages[i].populate({ path: "inventories" });
      }
    }
    return mapInventoryRows(packages);
  }
};

const forms = [];
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
      table[gtin] = { id, gtin, time: dateFilled, qty: 1 };
      const row = table[gtin];
      rows.push(row);
      const pkg = await package.findPackageByGTIN(gtin);
      if (pkg) {
        await pkg.populate([
          {
            path: "alternative",
            populate: [
              {
                path: "cahProduct",
                populate: { path: "package", populate: "psPackage" },
              },
              { path: "psAlternative" },
            ],
          },
          { path: "cahProduct" },
          { path: "psPackage" },
        ]);
        const {
          name,
          alternative,
          cahProduct,
          psPackage,
          ndc11,
          ndc,
          mfrName,
          mfr,
        } = pkg;
        const isBranded = alternative?.isBranded;
        const selectOriginal =
          cahProduct?.active &&
          (cahProduct.form === "OINTMENT" ||
            cahProduct.form === "CREAM" ||
            cahProduct.form === "DROPS");
        const cah = selectOriginal
          ? cahProduct
          : alternative?.cahProduct || cahProduct;
        row.name =
          name ||
          alternative?.name ||
          alternative?.defaultName ||
          cah?.name ||
          psPackage?.description ||
          ndc11 ||
          ndc ||
          gtin;
        row.mfr = mfrName || mfr || cah?.mfr || psPackage?.manufacturer || "";
        row.ndc = ndc11;
        let size = cah?.package.size || pkg.size;
        if (cah) {
          switch (cah.active) {
            case true:
              row.cah_status = "ACTIVE";
              row.cah_cin = cah.cin;
              row.cah_brandName = interpretCAHData(cah.brandName);
              row.cah_contract = cah.contract;
              row.cah_estNetCost = cah.estNetCost;
              row.cah_netUoiCost = cah.netUoiCost;
              row.cah_stockStatus = cah.stockStatus;
              row.cah_stock = cah.stock;
              row.cah_lastSFDCDate = interpretCAHData(cah.lastSFDCDate);
              row.cah_lastSFDCCost = interpretCAHData(cah.lastSFDCCost);
              break;
            case undefined:
              row.cah_status = "PENDING";
              break;
            case false:
              row.cah_status = "NA";
              break;
            default:
          }
          cah.package.size && (size = cah.package.size);
        }
        const ps = cah?.package.psPackage?.active
          ? cah.package.psPackage
          : psPackage;
        let psDescription;
        let psSize;
        if (ps) {
          switch (ps.active) {
            case true:
              row.ps_status = "ACTIVE";
              row.ps_ndc = ps.ndc;
              row.ps_pkgPrice = ps.pkgPrice;
              row.ps_unitPrice = ps.unitPrice;
              break;
            case undefined:
              row.ps_status = "PENDING";
              break;
            case false:
              if (psPackage) {
                switch (psPackage.active) {
                  case true:
                    row.ps_status = "ACTIVE";
                    row.ps_ndc = psPackage.ndc;
                    row.ps_pkgPrice = psPackage.pkgPrice;
                    row.ps_unitPrice = psPackage.unitPrice;
                    break;
                  case undefined:
                    row.ps_status = "PENDING";
                    break;
                  case false:
                    row.ps_status = "NA";
                    break;
                  default:
                }
              }
              break;
            default:
          }
          psDescription = ps.description;
          psSize = ps.pkg;
        }
        const ps_alt = alternative?.psAlternative;
        let ps_alt_same_description;
        let ps_alt_same_size;
        let ps_alt_lowest;
        if (ps_alt) {
          switch (ps_alt.active) {
            case true:
              for (let i = 0; i < ps_alt.items.length; i++) {
                const item = ps_alt.items[i];
                psDescription === item.description &&
                  (ps_alt_same_description = item);
                (psSize || size) === item.pkg &&
                  item.bG === "G" &&
                  (ps_alt_same_size = item);
                (!ps_alt_lowest ||
                  stringToNumber(ps_alt_lowest.unitPrice) >
                    stringToNumber(item.unitPrice)) &&
                  (ps_alt_lowest = item);
              }
              const _ps_alt =
                ps_alt_same_description || ps_alt_same_size || ps_alt_lowest;
              row.ps_alt_status = "ACTIVE";
              row.ps_alt_ndc = _ps_alt.ndc;
              row.ps_alt_pkgPrice = _ps_alt.pkgPrice;
              row.ps_alt_unitPrice = _ps_alt.unitPrice;
              if (row.ps_status === "NA" && isBranded === false) {
                row.ps_status = "ACTIVE";
                row.ps_ndc = _ps_alt.ndc;
                row.ps_pkgPrice = _ps_alt.pkgPrice;
                row.ps_unitPrice = _ps_alt.unitPrice;
              }
              break;
            case undefined:
              row.ps_alt_status = "PENDING";
              break;
            case false:
              row.ps_alt_status = "NA";
              break;
          }
        }
      } else {
        // handle without package info
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
 * @param {string|Date} [date]
 * @param {true} [refresh]
 * @returns {}
 */
exports.getUsages = async (date, refresh) => {
  // if date is today use cache else map a new array
  const day = typeof date === "string" ? dayjs(date, "MMDDYYYY") : dayjs(date);
  if (day.isSame(dayjs(), "d")) {
    if (refresh || !__invUsageToday) {
      __invUsageToday = await mapUsageRows(await item.findItemsByFilledDate());
    }
    return __invUsageToday;
  }
  return await mapUsageRows(await item.findItemsByFilledDate(date));
};

/** inv/Usage Checker **/
exports.__invUsageChecker = {};
/**
 * @param {string} date MMDDYYYY
 * @param {string} gtin
 * @param {true} [reset]
 * @returns {Object.<string, boolean>}
 */
exports.useInvUsageChecker = (date, gtin, reset) => {
  const __invUsageChecker = exports.__invUsageChecker;
  if (!__invUsageChecker[date]) {
    __invUsageChecker[date] = {};
  }
  const table = __invUsageChecker[date];
  if (reset) {
    delete table[gtin];
  } else if (table[gtin]) {
    table[gtin] = false;
  } else {
    table[gtin] = true;
  }
  return __invUsageChecker[date];
};
