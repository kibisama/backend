const NdcDir = require("../schemas/openFDA/ndcDir");
const { ndc } = require("../api/openFda");

module.exports = async (arg, type) => {
  let query = arg;
  if (type) {
    switch (true) {
      case type === "ndc":
        query = `"${arg}"`;
        break;
      case type === "gtin":
        query = `${arg.slice(3, 7)}*${arg[7]}*${arg.slice(8, 11)}*${arg[11]}*${
          arg[12]
        }`;
        break;
      default:
    }
  }
  const result = await ndc.searchOneByPackageNdc(query);
  if (!result) {
    return new Error("OpenFDA API Error");
  } else if (result.data.meta?.results?.total > 1) {
    return new Error("Multiple Results Found");
  }
  const data = result.data.results[0];
  return await NdcDir.create({
    last_updated: result.data.meta.last_updated,
    ...data,
  }).catch((e) => {
    console.log(e);
    return e;
  });
};
