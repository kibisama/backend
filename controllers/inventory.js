const alt = require("../services/inv/alternative");
const item = require("../services/inv/item");

/**
 * @param {[alt.Alternative]} alts
 * @return {[string]}
 */
const mapAutocompleteOptions = (alts) =>
  alts.map((v) => ({ label: v.name || v.defaultName, _id: v._id }));

exports.getAlternatives = async (req, res, next) => {
  try {
    return res.status(200).send({
      code: 200,
      data: mapAutocompleteOptions(await alt.getAllDocuments()),
    });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

/**
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
 * @param {alt.Package} pkg populated inventories
 * @returns {string}
 */
const getRowLabel = (pkg) => {
  const mfrName = pkg.mfrName || pkg.mfr;
  return `${
    (mfrName ? mfrName + " | " : "") +
    (pkg.gtin || pkg.inventories[0]?.gtin || pkg.ndc11 || pkg.ndc)
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
    }
  });
  return { rows, count };
};
exports.getInventories = async (req, res, next) => {
  try {
    const { _id, filled } = req.query;
    if (!_id) {
      return res.status(400).send({ code: 400, message: "Bad Request" });
    }
    const packages = await alt.getPackagesWithInventories(_id);
    if (packages?.length > 0) {
      if (filled === "true") {
        for (let i = 0; i < packages.length; i++) {
          const { gtin } = packages[i];
          if (!gtin) {
            continue;
          }
          packages[i].inventories = await item.findItemsByGTIN(gtin);
          await packages[i].populate({ path: "inventories" });
        }
      }
      return res
        .status(200)
        .send({ code: 200, data: mapInventoryRows(packages) });
    } else {
      return res.status(404).send({ code: 404 });
    }
  } catch (e) {
    console.error(e);
    next(e);
  }
};
