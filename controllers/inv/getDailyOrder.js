const dailyOrder = require("../../services/inv/dailyOrder");

module.exports = async (req, res, next) => {
  try {
    const dailyOrders = await dailyOrder.findDOByDateString(req.params.date);
    if (dailyOrders.length > 0) {
      const populatedDOs = [];
      for (let i = 0; i < dailyOrders.length; i++) {
        const popDO = await dailyOrder.populateDO(dailyOrders[i]);
        populatedDOs.push(popDO);
      }
      const results = populatedDOs.map((v) => dailyOrder.generateData(v));
      console.log(results);
      return res.send({ results });
    }
    return res.send({ results: dailyOrders });
  } catch (e) {
    console.log(e);
  }
};
