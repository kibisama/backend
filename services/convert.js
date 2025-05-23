module.exports = {
  /**
   * Returns a number from a string (e.g. USD currency).
   * @param {string} string
   * @returns {number}
   */
  stringToNumber(string) {
    return Number(string.replaceAll(/[^0-9.-]+/g, ""));
  },
  /**
   * Returns a 11-digit ndc string from a 10-digit ndc string.
   * @param {string} ndc
   * @returns {string}
   */
  ndcToNDC11(ndc) {
    if (ndc[4] === "-") {
      return "0" + ndc;
    } else if (ndc[10] === "-") {
      return ndc.slice(0, 11).concat("0", ndc[11]);
    } else if (ndc[9] === "-") {
      return ndc.slice(0, 6).concat("0", ndc.slice(6, 12));
    }
  },
  /**
   * Returns a CMS 11-digit NDC from a 10-digit ndc string.
   * @param {string} ndc
   * @returns {string}
   */
  ndcToCMSNDC11(ndc) {
    return module.exports.ndcToNDC11(ndc).replaceAll("-", "");
  },
  /**
   * Returns a 11-digit ndc with hyphens from a CMS 11-digit NDC.
   * @param {string} ndc11
   * @returns {string}
   */
  hyphenateNDC11(ndc11) {
    return (
      ndc11.substring(0, 5) +
      "-" +
      ndc11.substring(5, 9) +
      "-" +
      ndc11.substring(9)
    );
  },
  /**
   * Returns a regExp of ndc11 from a gtin string.
   * @param {string} gtin
   * @returns {RegExp}
   */
  gtinToNDC11RegExp(gtin) {
    const frag = [
      gtin.slice(3, 7),
      gtin[7],
      gtin.slice(8, 11),
      gtin[11],
      gtin[12],
    ];
    return new RegExp(
      String.raw`0${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}|${
        frag[0] + frag[1]
      }-${frag[2] + frag[3]}-0${frag[4]}|${frag[0] + frag[1]}-0${frag[2]}-${
        frag[3] + frag[4]
      }`
    );
  },
  /**
   * Returns a regExp of 10-digit ndc from a gtin string.
   * @param {string} gtin
   * @returns {RegExp}
   */
  gtinStringToNDCRegExp(gtin) {
    return new RegExp(
      String.raw`${gtin.slice(3, 7)}-?${gtin[7]}-?${gtin.slice(8, 11)}-?${
        gtin[11]
      }-?${gtin[12]}`
    );
  },
  /**
   * Returns a regExp of 10-digit ndc from a 11-digit ndc string.
   * @param {string} ndc11
   * @returns {RegExp}
   */
  ndc11StringToNDCRegExp(ndc11) {
    let raw = "";
    if (ndc11[0] === "0") {
      raw += ndc11.substring(1);
    }
    if (ndc11[6] === "0") {
      if (raw) {
        raw += "|";
      }
      raw += ndc11.slice(0, 6).concat(ndc11.slice(7));
    }
    if (ndc11[11] === "0") {
      if (raw) {
        raw += "|";
      }
      raw += ndc11.substring(0, 11) + ndc11[12];
    }
    return new RegExp(raw);
  },
  /**
   * Returns a regExp of gtin from a 11-digit ndc string.
   * @param {string} ndc11
   * @returns {RegExp}
   */
  ndc11StringToGTINRegExp(ndc11) {
    return new RegExp(
      String.raw`\d{3}(?:${module.exports
        .ndc11StringToNDCRegExp(ndc11)
        .source.replaceAll("-", "")})\d`
    );
  },
  /**
   * Returns a regExp of gtin from a 10-digit ndc string.
   * @param {string} ndc
   * @returns {RegExp}
   */
  ndcStringToGTINRegExp(ndc) {
    return new RegExp(String.raw`\d{3}${ndc.replaceAll("-", "")}\d$`);
  },
  /**
   * Returns an array of 3 possible 10-digit ndcs.
   * @param {string} gtin
   * @returns {[string]}
   */
  gtinToNDC(gtin) {
    const frag = [
      gtin.slice(3, 7),
      gtin[7],
      gtin.slice(8, 11),
      gtin[11],
      gtin[12],
    ];
    return [
      `${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}`,
      `${frag[0] + frag[1]}-${frag[2] + frag[3]}-${frag[4]}`,
      `${frag[0] + frag[1]}-${frag[2]}-${frag[3] + frag[4]}`,
    ];
  },
};
