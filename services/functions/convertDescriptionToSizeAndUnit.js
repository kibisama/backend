/**
 * @param {string} desc
 * @returns {[[Number],[String]]}
 */
module.exports = (desc) => {
  const gMatch = desc.match(
    /([\d\.]+)(\s)(\D+)(\s)(in)(\s)([\d\.]+)(\s)(\D[^\(]+)/g
  );
  if (!gMatch) {
    return;
  }
  const match = gMatch.map((v) =>
    v.match(/([\d\.]+)(\s)(\D+)(\s)(in)(\s)([\d\.]+)(\s)(\D[^\(]+)/)
  );
  let size = [];
  let unit = [];
  match.forEach((v) => {
    size.push(Number(v[1]), Number(v[7]));
    unit.push(v[3], v[9].trim());
  });
  return [size, unit];
};
