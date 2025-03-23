/**
 * @template T
 * @param {T} defaultOption
 * @param {T} option
 * @returns {T}
 */
const setOptionParameters = (defaultOption = {}, option) => {
  return option instanceof Object
    ? Object.assign(defaultOption, option)
    : defaultOption;
};

module.exports = {};
