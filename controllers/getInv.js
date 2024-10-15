const Drug = require("../schemas/drug");
const Alternative = require("../schemas/alternative");
const Package = require("../schemas/package");
const Item = require("../schemas/item");
const dayjs = require("dayjs");
const constructDrugTrees = require("../services/constructDrugTrees");

const getInv = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    const startOfToday = dayjs().startOf("d");
    const endOfToday = dayjs().endOf("d");
    const drugs = await Drug.find({}, { name: 1, dea_schedule: 1 })
      .populate([
        {
          path: "families",
          select: ["name", "strength", "optimalQty", "unit"],
          options: { sort: { name: 1 } },
          populate: [
            {
              path: "alternatives",
              select: [
                "ndc",
                "ndc11",
                "dosage_form",
                "name",
                "size",
                "unit",
                "preferred",
                "optimalQty",
                "optimalUnit",
              ],
              populate: [
                {
                  path: "inventories",
                  match: {
                    $and: [
                      { dateFilled: undefined },
                      { dateReturned: undefined },
                    ],
                    // $or: [
                    //   { dateFilled: { $gte: startOfToday, $lte: endOfToday } },
                    //   { dateFilled: undefined },
                    // ],
                  },
                  select: [
                    "lot",
                    "sn",
                    "exp",
                    "cost",
                    "dateReceived",
                    "source",
                    "dateFilled",
                  ],
                },
              ],
            },
          ],
        },
      ])
      .sort({ name: 1 });
    const trees = constructDrugTrees(drugs);
    return res.send(trees);
  }
};

module.exports = getInv;
