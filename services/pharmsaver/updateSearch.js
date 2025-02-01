const dayjs = require("dayjs");
const { scheduleJob } = require("node-schedule");
const { ps } = require("../../api/puppet");
const { PSItem, PSSearch } = require("../../schemas/pharmsaver");
const { Package } = require("../../schemas/inventory");
const analyzeSearchResults = require("./analyzeSearchResults");
const createItem = require("./createItem");
const voidSearch = require("./voidSearch");
const voidItem = require("./voidItem");
const createSearch = require("./createSearch");

/**
 * Request the Puppeteer server to update PharmSaver Search results. Requires a Package document.
 * @param {Package} package
 * @param {function} callback
 * @returns {Promise<PSSearch|Error>}
 */
module.exports = async (package, callback) => {
  const { _id, ndc11, alternative, psItem } = package;
  const _ndc11 = ndc11.replaceAll("-", "");
  let count = 0;
  const maxCount = 99;
  /**
   * Inner function that requests Puppeteer server to update PSSearch.
   * @returns {Promise<PSSearch|undefined>}
   */
  async function update() {
    const result = await ps.getSearchResults(_ndc11);
    if (result instanceof Error) {
      switch (result.status) {
        case 404:
          await voidSearch(alternative);
          await voidItem(package);
          break;
        case 500:
          if (count < maxCount) {
            count++;
            scheduleJob(dayjs().add(5, "minute").toDate(), update); // settings
          }
          break;
        case 503:
          scheduleJob(dayjs().add(3, "minute").toDate(), update); // settings
          break;
        default:
      }
      return result;
    } else {
      const _results = result.data.results;
      _results.forEach((v) => {
        /* Pharmsaver item descriptions can be different from each client */
        const suffix = ` ${v.str} ${v.form} (${v.pkg})`;
        if (!v.description.endsWith(suffix)) {
          v.description += suffix;
        }
      });
      const { item, results } = analyzeSearchResults(_results, _ndc11);
      if (item) {
        if (psItem) {
          await PSItem.findOneAndUpdate(
            { _id: psItem },
            { $set: { lastUpdated: new Date(), active: true, ...item } }
          );
        } else {
          await createItem(item, package);
        }
      } else {
        await voidItem(package);
      }
      if (!alternative) {
        return new Error();
      }
      let psSearch = await PSSearch.findOneAndUpdate(
        { alternative },
        { $set: { lastUpdated: new Date(), active: true, results } }
      );
      if (!psSearch) {
        psSearch = await createSearch(results, alternative);
      }
      if (callback instanceof Function) {
        const package = await Package.findOne({ _id });
        callback(package);
      }
      return psSearch;
    }
  }
  try {
    return await update();
  } catch (e) {
    console.log(e);
    return e;
  }
};
