const fs = require("fs");
const dayjs = require("dayjs");
const axios = require("axios");
const { stringToNumber } = require("./convert");

module.exports = {
  /**
   * @template T
   * @param {T} defaultOption
   * @param {T} option
   * @returns {T}
   */
  setOptionParameters(defaultOption = {}, option) {
    return option instanceof Object
      ? Object.assign(defaultOption, option)
      : defaultOption;
  },
  /**
   * Returns the highest number (type: string|number) and its index in an array
   * if there is a key, it compares the property of each element
   * @param {[number|string]} array
   * @param {string} [key]
   * @returns {[string, number]}
   */
  getMaxNumberString(array, key) {
    let number = stringToNumber(key ? array[0][key] : array[0]);
    let index = 0;
    if (array.length > 1) {
      for (let i = 1; i < array.length; i++) {
        const _number = stringToNumber(key ? array[i][key] : array[i]);
        if (number < _number) {
          number = _number;
          index = i;
        }
      }
    }
    return [number.toString(), index];
  },
  /**
   * Returns the lowest number (type: string|number) and its index in an array
   * if there is a key, it compares the property of each element
   * @param {[number|string]} array
   * @param {string} [key]
   * @returns {[string, number]}
   */
  getMinNumberString(array, key) {
    let number = stringToNumber(key ? array[0][key] : array[0]);
    let index = 0;
    if (array.length > 1) {
      for (let i = 1; i < array.length; i++) {
        const _number = stringToNumber(key ? array[i][key] : array[i]);
        if (number > _number) {
          number = _number;
          index = i;
        }
      }
    }
    return [number.toString(), index];
  },
  /**
   * Save an Image file.
   * @param {string} path
   * @param {string} url
   * @returns {Promise<undefined>}
   */
  async saveImg(path, url) {
    try {
      fs.access(path, fs.constants.F_OK, async (err) => {
        if (err) {
          const { data } = await axios.get(url, {
            responseType: "arraybuffer",
          });
          if (data) {
            fs.writeFileSync(path, data);
          }
        }
      });
    } catch (e) {
      console.log(e);
    }
  },
  /**
   * Returns true if today is between Mon-Fri.
   * @returns {boolean}
   */
  isStoreOpen() {
    const day = dayjs().day();
    return day === 0 || day === 6 ? false : true;
  },
  /**
<<<<<<< HEAD
   * @param {dayjs.Dayjs} exp
   * @returns {boolean}
   */
  isShortDated(exp) {
    return exp.isBefore(dayjs().add(11, "month"));
=======
   * @param {string} exp
   * @param {string} format
   * @returns {boolean}
   */
  isShortDated(exp, format) {
    return dayjs(exp, format).isBefore(dayjs().add(12, "month"));
>>>>>>> 6cc3b70e4fb2aac141650a3374c7a4c617510873
  },
};
