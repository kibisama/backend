const { cardinal } = require("../../api/puppet");
const { handleResults } = require("../../services/cah/UpsertItemsViaDSCSA");

module.exports = async (req, res, next) => {
  try {
    const result = await cardinal.getDSCSAData(req.body);
    if (result instanceof Error) {
      if (result.status === 503) {
        return res.sendStatus(503);
      }
    } else if (await handleResults(result.results)) {
      //
      return res.sendStatus(200);
    }
    return res.sendStatus(500);
  } catch (e) {
    console.log(e);
  }
};
