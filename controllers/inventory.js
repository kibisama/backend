const alt = require("../services/inv/alternative");

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
 * @returns {[Row]}
 */
const mapInventoryRows = (packages) => {
  /** @type {[Row]} */
  const rows = [];
  let id = 0;
  packages.forEach((pkg) => {
    if (pkg.inventories.length > 0) {
      id += 1;
      rows.push({ label: true, _id: pkg._id, id, lot: getRowLabel(pkg) });
      pkg.inventories.forEach((item) => {
        id += 1;
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
        });
      });
    }
  });
  return rows;
};
exports.getInventories = async (req, res, next) => {
  try {
    const { _id, all } = req.query;
    if (all === "true") {
      // return
    }
    const packages = await alt.getPackagesWithInventories(_id);
    if (packages) {
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
