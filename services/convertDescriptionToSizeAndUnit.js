module.exports = (desc) => {
  const gMatch = desc.match(
    /([\d\.]+)(\s)(\D+)(\s)(in)(\s)([\d\.]+)(\s)(\D+)(\s)/g
  );
  const match = gMatch.map((v) =>
    v.match(/([\d\.]+)(\s)(\D+)(\s)(in)(\s)([\d\.]+)(\s)(\D+)(\s)/)
  );
  let size = [];
  let unit = [];
  match.forEach((v) => {
    size.push(Number(v[1]), Number(v[7]));
    unit.push(v[3], v[9]);
  });
  return [size, unit];
};
