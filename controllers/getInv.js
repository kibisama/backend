const Drug = require("../schemas/drug");
const Alternative = require("../schemas/alternative");
const Package = require("../schemas/package");
const Item = require("../schemas/item");
const dayjs = require("dayjs");

const getInv = async (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    const startOfToday = dayjs().startOf("d");
    const endOfToday = dayjs().endOf("d");
    const drugs = await Drug.find(
      {},
      { _id: 0, generic_name: 1, dea_schedule: 1 }
    ).populate([
      {
        path: "families",
        select: ["brand_name_base", "strength", "optimalQty"],
        populate: [
          {
            path: "alternatives",
            select: [
              "ndc",
              "ndc11",
              "dosage_form",
              "manufacturer_name",
              "size",
              "unit",
              "preferred",
            ],
            populate: [
              {
                path: "inventories",
                match: {
                  $or: [
                    { dateFilled: { $gte: startOfToday, $lte: endOfToday } },
                    { dateFilled: undefined },
                  ],
                },
                select: [
                  "name -_id",
                  "gtin",
                  "lot",
                  "sn",
                  "exp",
                  "dateReceived",
                  "source",
                  "dateFilled",
                ],
              },
            ],
          },
        ],
      },
    ]);
    return res.send(drugs);
  }
};

module.exports = getInv;
