module.exports = {
  /**
   * Returns a 11-digit ndc with hyphens from a 11-digit ndc with no hyphens.
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
   * Returns a 11-digit ndc with hyphens.
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
   * Returns an array of at least one possible ndc with hyphens.
   * @param {string} ndc11
   * @returns {[string]}
   */
  ndc11ToNDC(ndc11) {
    const result = [];
    if (ndc11[0] === "0") {
      result.push(ndc11.substring(1));
    }
    if (ndc11[6] === "0") {
      result.push(ndc11.slice(0, 6).concat(ndc11.slice(7)));
    }
    if (ndc11[11] === "0") {
      result.push(ndc11.substring(0, 11) + ndc11[12]);
    }
    return result;
  },
  /**
   * Returns an array of 3 possible ndcs with hyphens.
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
  /**
   * Returns an object of sizes and units information.
   * @param {string} desc
   * @returns {object}
   */
  packagingDescriptionToSizesAndUnits(desc) {
    let _desc = "";
    const ndcs = desc.match(/[\d-]{12}/g);
    if (ndcs?.length > 1) {
      _desc = desc.match(
        new RegExp(String.raw`.+\(${ndcs[ndcs.length - 1]}\)`)
      )[0];
    } else {
      _desc = desc;
    }
    const gMatch = _desc.match(
      /([\d\.]+)(\s)(\D+)(\sin\s)([\d\.]+)(\s)(\D[^\(\/]+)/g
    );
    if (!gMatch) {
      return;
    }
    const match = gMatch.map((v) =>
      v.match(/([\d\.]+)(\s)(\D+)(\sin\s)([\d\.]+)(\s)(\D[^\(\/]+)/)
    );
    const _sizes = [];
    const _units = [];
    match.forEach((v) => {
      _sizes.push(Number(v[1]), Number(v[5]));
      _units.push(v[3], v[7].trim());
    });
    const index = _units.length - 2 > -1 ? _units.length - 2 : 0;
    const unit = _units[index];
    const units = [...new Set(_units)];
    let sizes = [];
    units.forEach((v) => {
      const index = _units.indexOf(v);
      let _size;
      if (index % 2) {
        _size = _sizes[1];
        if (index > 1) {
          for (let i = 3; i < index + 1; i = i + 2) {
            _size *= _sizes[i];
          }
        }
      } else {
        _size = 1;
        for (let i = 0; i < index + 2; i++) {
          if (i % 2) {
            _size /= _sizes[i];
          } else {
            _size *= _sizes[i];
          }
        }
      }
      sizes.push(_size.toString());
    });
    const size = sizes[units.indexOf(unit)];
    return { unit, units, size, sizes };
  },
};
