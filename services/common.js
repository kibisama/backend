const { stringToNumber } = require("./convert");

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

/**
 * Returns the highest number (type: string|number) and its index in an array
 * @param {[number|string]} array
 * @returns {[string, number]}
 */
const getMaxNumberString = (array) => {
  let number = stringToNumber(array[0]);
  let index = 0;
  if (array.length > 1) {
    for (let i = 1; i < array.length; i++) {
      const _number = stringToNumber(array[i]);
      if (number < _number) {
        number = _number;
        index = i;
      }
    }
  }
  return [number.toString(), index];
};

module.exports = { setOptionParameters, getMaxNumberString };
