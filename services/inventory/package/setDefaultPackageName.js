const { Package, Alternative } = require("../../../schemas/inventory");

/**
 * Sets default name and mfrName fields of a Package document.
 * @param {Package}
 * @returns {Promise<Package|undefined>}
 */
module.exports = async (package) => {
  try {
    const {
      _id,
      alternative,
      brand_name,
      generic_name,
      gtin,
      ndc11,
      manufacturerName,
      labeler_name,
      strength,
      size,
    } = package;
    let form;
    if (alternative) {
      form = (await Alternative.findOne({ _id: alternative })).form;
    }
    let name = "";
    const _name = brand_name ?? generic_name;
    if (_name) {
      name += _name;
    } else {
      name += ndc11 ?? gtin;
    }
    if (strength) {
      name += ` ${strength}`;
    }
    if (form) {
      name += ` ${form}`;
    }
    if (size) {
      name += ` (${size})`;
    }
    let mfrName;
    const _mfrName = manufacturerName ?? labeler_name;
    if (_mfrName?.length > 9) {
      const match = _mfrName.match(/([^\s,]+)/g);
      if (match) {
        if (match[0].length < 10) {
          mfrName = match[0];
        } else {
          mfrName = _mfrName.substring(0, 9);
        }
      }
    } else if (_mfrName) {
      mfrName = _mfrName;
    }
    return await Package.findOneAndUpdate(
      { _id },
      { $set: { name, mfrName } },
      { new: true }
    );
  } catch (e) {
    console.log(e);
  }
};
