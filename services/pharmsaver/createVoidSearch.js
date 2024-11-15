const dayjs = require("dayjs");
const PSSearch = require("../../schemas/pharmsaver/psSearch");

module.exports = async (ndc11) => {
  const ndc = ndc11.replaceAll("-", "");
  try {
    const _result = await PSSearch.findOne({ ndc });
    if (_result) {
      return;
    } else {
      return await PSSearch.create({
        lastUpdated: dayjs(),
        ndc: [ndc],
      });
    }
  } catch (e) {
    console.log(e);
  }
};
