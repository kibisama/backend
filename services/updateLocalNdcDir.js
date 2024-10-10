const NdcDir = require("../schemas/openFDA/ndcDir");
const { ndc } = require("../api/openFda");

module.exports = async (arg, type) => {
  let query, result;
  if (type) {
    switch (true) {
      case type === "gtin":
        const frag = [
          arg.slice(3, 7),
          arg[7],
          arg.slice(8, 11),
          arg[11],
          arg[12],
        ];
        query = `"${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}"+"${
          frag[0] + frag[1]
        }-${frag[2] + frag[3]}+${frag[4]}"+"${frag[0] + frag[1]}-${frag[2]}-${
          frag[3] + frag[4]
        }"`;
        result = await ndc.searchOneByPackageDescription(query);
        break;
      default:
    }
  }
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
