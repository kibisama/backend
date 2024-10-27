const NdcDir = require("../../schemas/openFDA/ndcDir");
const { ndc } = require("../../api/openFda");

module.exports = async (arg, type) => {
  try {
    let query, result;
    if (type) {
      let frag = [];
      switch (true) {
        case type === "gtin":
          frag = [arg.slice(3, 7), arg[7], arg.slice(8, 11), arg[11], arg[12]];
          break;
        case type === "ndc":
          frag = [arg.slice(0, 4), arg[4], arg.slice(5, 8), arg[8], arg[9]];
          break;
        default:
          throw new Error("Invalid argument type");
      }
      query = `"${frag[0]}-${frag[1] + frag[2]}-${frag[3] + frag[4]}"+"${
        frag[0] + frag[1]
      }-${frag[2] + frag[3]}+${frag[4]}"+"${frag[0] + frag[1]}-${frag[2]}-${
        frag[3] + frag[4]
      }"`;
      result = await ndc.searchOneByPackageDescription(query);
    }
    if (!result) {
      return new Error("Open FDA error");
    } else if (result.data.meta?.results?.total > 1) {
      return new Error("Multiple results found");
    }

    const data = result.data.results[0];
    return await NdcDir.findOneAndUpdate(
      { product_ndc: data.product_ndc },
      {
        last_updated: result.data.meta.last_updated,
        ...data,
      },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.log(e);
  }
};
