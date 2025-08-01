const fg = require("../../services/apps/facilityGroup");

exports.get = async (req, res, next) => {
  try {
    return res.send({ results: await fg.getFacilityGroups() });
  } catch (e) {
    console.error(e);
    next(e);
  }
};

exports.post = async (req, res, next) => {
  const { method } = req.body;
  const { name } = req.params;
  try {
    switch (method) {
      case "CREATE":
        const exGroup = await fg.findFacilityGroup({ name });
        if (exGroup) {
          return res.sendStatus();
        }
        await fg.createFacilityGroup(name);
        break;
      case "UPDATE":
        break;
      case "ADD":
        break;
      case "PULL":
        break;
    }
    return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    next(e);
  }
};
