/**
 * @param {string} _desc
 * @returns {[[Number],[String]]}
 */
module.exports = (_desc) => {
  let desc = "";
  const ndcs = _desc.match(/[\d-]{12}/g);
  if (ndcs?.length > 1) {
    desc = _desc.match(
      new RegExp(String.raw`.+\(${ndcs[ndcs.length - 1]}\)`)
    )[0];
  } else {
    desc = _desc;
  }
  const gMatch = desc.match(
    /([\d\.]+)(\s)(\D+)(\sin\s)([\d\.]+)(\s)(\D[^\(\/]+)/g
  );
  if (!gMatch) {
    return;
  }
  const match = gMatch.map((v) =>
    v.match(/([\d\.]+)(\s)(\D+)(\sin\s)([\d\.]+)(\s)(\D[^\(\/]+)/)
  );
  const size = [];
  const unit = [];
  match.forEach((v) => {
    size.push(Number(v[1]), Number(v[5]));
    unit.push(v[3], v[7].trim());
  });
  return [size, unit];
};
