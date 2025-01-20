/**
 * Converts a packaging description to size and unit.
 * @param {string} desc
 * @returns {object}
 */
module.exports = (desc) => {
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
};
