const DRX = require("../../schemas/digitalRx");

/**
 * @typedef {DRX.DigitalRx} DigitalRx
 * @typedef {DRX.RxStatus} RxStatus
 * @typedef {DRX.RxStatusFin} RxStatusFin
 * @typedef {typeof DRX.schema.obj} RxObj
 */

/**
 * @param {RxObj} rx
 * @return {{rxID: string}}
 */
const createBase = (rx) => {
  return { rxID: rx.rxID };
};

module.exports = {
  /**
   * Upserts (or updates if exists) a Digital Rx document.
   * @param {RxObj} rx
   * @returns {Promise<DigitalRx|undefined>}
   */
  async upsertDrx(rx) {
    try {
      const base = createBase(rx);
      const drx = await DRX.findOne(base);
      if (drx === null) {
        return await DRX.create(rx);
      }
      return await DRX.findByIdAndUpdate(drx._id, rx, { new: true });
    } catch (e) {
      console.log(e);
    }
  },
  /**
   * @param {RxObj} rx
   * @returns {Boolean}
   */
  isFileOnly(rx) {
    /** @type {RxStatus} */
    const rxStatus = rx.rxStatus;
    switch (rxStatus) {
      case "FILEONLY":
      case "DC-FILEONLY":
      case "FO-TRANSFERRED":
      case "FUTURE BILL":
        return true;
      default:
        return false;
    }
  },
  /**
   * @param {RxObj} rx
   * @returns {Boolean}
   */
  isBilled(rx) {
    /** @type {RxStatusFin} */
    const rxStatusFin = rx.rxStatusFin;
    if (rxStatusFin === "BILLED") {
      return true;
    }
    return false;
  },
};
