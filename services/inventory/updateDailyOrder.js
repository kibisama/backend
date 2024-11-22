const dayjs = require("dayjs");
const DailyOrder = require("../../schemas/inventory/dailyOrder");
const CardinalItem = require("../../schemas/cardinal/cardinalItem");
const PSSearch = require("../../schemas/pharmsaver/psSearch");

module.exports = async (dailyOrder, ndc11) => {
  try {
    const query = {};
    if (!ndc11) {
      const { package } = await DailyOrder.findById(dailyOrder._id).populate([
        { path: "package", select: ["ndc11"] },
      ]);
      ndc11 = package.ndc11;
    }
    // const cardinalItem = await CardinalItem.findOne({ ndc: ndc11 });
    const _ndc11 = ndc11.replaceAll("-", "");
    const psSearch = await PSSearch.findOne({ query: _ndc11 });
    // if (cardinalItem) {
    //   query.cardinalCost = cardinalItem.estNetCost;
    // }
    if (psSearch) {
      const {
        lastUpdated,
        description,
        str,
        pkg,
        form,
        pkgPrice,
        ndc,
        qtyAvl,
        unitPrice,
        rxOtc,
        lotExpDate,
        bG,
        wholesaler,
        manufacturer,
      } = psSearch;
      const psAlts = {
        description: [],
        pkg: [],
        pkgPrice: [],
        ndc: [],
        qtyAvl: [],
        unitPrice: [],
        rxOtc: [],
        wholesaler: [],
        manufacturer: [],
      };
      /* if PS Search is void */
      if (ndc.length === 0) {
        query.psDetails = {
          lastUpdated,
          description: "NOT AVAILABLE",
          pkgPrice: "NOT AVAILABLE",
          qtyAvl: "NOT AVAILABLE",
          unitPrice: "NOT AVAILABLE",
          wholesaler: "NOT AVAILABLE",
          lotExpDate: "NOT AVAILABLE",
        };
        Object.keys(psAlts).forEach((v) => {
          psAlts[v].push("NOT AVAILABLE");
        });
        query.psAlts = psAlts;
      } else {
        const searchResults = [];
        description.forEach((v, i) => {
          searchResults.push({
            description: v,
            str: str[i],
            pkg: pkg[i],
            form: form[i],
            pkgPrice: pkgPrice[i],
            ndc: ndc[i],
            qtyAvl: qtyAvl[i],
            unitPrice: unitPrice[i],
            rxOtc: rxOtc[i],
            lotExpDate: lotExpDate[i],
            bG: bG[i],
            wholesaler: wholesaler[i],
            manufacturer: manufacturer[i],
          });
        });
        const sortFn = (a, b) =>
          Number(a.unitPrice.replace(/[^0-9.]+/g, "")) -
          Number(b.unitPrice.replace(/[^0-9.]+/g, ""));
        const sortedSameNdcResults = searchResults
          .filter((v) => v.ndc === _ndc11)
          .sort(sortFn);
        /* if no original ndc found, the lowest unitPrice of each description will be suggested */
        if (sortedSameNdcResults.length === 0) {
          query.psDetails = {
            lastUpdated,
            description: "NOT AVAILABLE",
            pkgPrice: "NOT AVAILABLE",
            qtyAvl: "NOT AVAILABLE",
            unitPrice: "NOT AVAILABLE",
            wholesaler: "NOT AVAILABLE",
            lotExpDate: "NOT AVAILABLE",
          };
          const _description = [...new Set(description)];
          _description.forEach((v) => {
            const sortedSameDescResults = searchResults // 0 index the cheapest
              .filter((v) => (v.description = v))
              .sort(sortFn);
            psAlts.description.push(v);
            psAlts.pkg.push(sortedSameDescResults[0].pkg);
            psAlts.pkgPrice.push(sortedSameDescResults[0].pkgPrice);
            psAlts.ndc.push(sortedSameDescResults[0].ndc);
            psAlts.qtyAvl.push(sortedSameDescResults[0].qtyAvl);
            psAlts.unitPrice.push(sortedSameDescResults[0].unitPrice);
            psAlts.rxOtc.push(sortedSameDescResults[0].rxOtc);
            psAlts.wholesaler.push(sortedSameDescResults[0].wholesaler);
            psAlts.manufacturer.push(sortedSameDescResults[0].manufacturer);
          });
        } else {
          /* else one with the lowest unitPrice and the same pkg and/or the overall lowest unitPrice will be suggested */
          query.psDetails = {
            lastUpdated,
            description: sortedSameNdcResults[0].description,
            pkgPrice: sortedSameNdcResults[0].pkgPrice,
            qtyAvl: sortedSameNdcResults[0].qtyAvl,
            unitPrice: sortedSameNdcResults[0].unitPrice,
            wholesaler: sortedSameNdcResults[0].wholesaler,
            lotExpDate: sortedSameNdcResults[0].lotExpDate,
          };
          const _sameNdcDescriptions = [];
          sortedSameNdcResults.forEach((v) => {
            _sameNdcDescriptions.push(v.description);
          });
          const sameNdcDescriptions = [...new Set(_sameNdcDescriptions)];
          const sortedSameDescResults = searchResults
            .filter((v) => sameNdcDescriptions.includes(v.description))
            .sort(sortFn);
          if (sortedSameDescResults.length === 0) {
            Object.keys(psAlts).forEach((v) => {
              psAlts[v].push("NOT AVAILABLE");
            });
          } else {
            const pkg = sortedSameNdcResults[0].pkg;
            const sortedSamePkgAndDescResults = sortedSameDescResults.filter(
              (v) => v.pkg === pkg
            );
            if (
              Number(
                sortedSamePkgAndDescResults[0].unitPrice.replace(
                  /[^0-9.]+/g,
                  ""
                )
              ) <
              Number(sortedSameNdcResults[0].unitPrice.replace(/[^0-9.]+/g, ""))
            ) {
              psAlts.description.push(
                sortedSamePkgAndDescResults[0].description
              );
              psAlts.pkg.push(sortedSamePkgAndDescResults[0].pkg);
              psAlts.pkgPrice.push(sortedSamePkgAndDescResults[0].pkgPrice);
              psAlts.ndc.push(sortedSamePkgAndDescResults[0].ndc);
              psAlts.qtyAvl.push(sortedSamePkgAndDescResults[0].qtyAvl);
              psAlts.unitPrice.push(sortedSamePkgAndDescResults[0].unitPrice);
              psAlts.rxOtc.push(sortedSamePkgAndDescResults[0].rxOtc);
              psAlts.wholesaler.push(sortedSamePkgAndDescResults[0].wholesaler);
              psAlts.manufacturer.push(
                sortedSamePkgAndDescResults[0].manufacturer
              );
            }
            if (
              Number(
                sortedSameDescResults[0].unitPrice.replace(/[^0-9.]+/g, "")
              ) <
              Number(
                sortedSameNdcResults[0].unitPrice.replace(/[^0-9.]+/g, "") &&
                  Number(
                    sortedSameDescResults[0].unitPrice.replace(/[^0-9.]+/g, "")
                  ) <
                    Number(
                      sortedSamePkgAndDescResults[0].unitPrice.replace(
                        /[^0-9.]+/g,
                        ""
                      )
                    )
              )
            ) {
              psAlts.description.push(sortedSameDescResults[0].description);
              psAlts.pkg.push(sortedSameDescResults[0].pkg);
              psAlts.pkgPrice.push(sortedSameDescResults[0].pkgPrice);
              psAlts.ndc.push(sortedSameDescResults[0].ndc);
              psAlts.qtyAvl.push(sortedSameDescResults[0].qtyAvl);
              psAlts.unitPrice.push(sortedSameDescResults[0].unitPrice);
              psAlts.rxOtc.push(sortedSameDescResults[0].rxOtc);
              psAlts.wholesaler.push(sortedSameDescResults[0].wholesaler);
              psAlts.manufacturer.push(sortedSameDescResults[0].manufacturer);
            }
            query.psAlts = psAlts;
          }
        }
      }
    }
    // if (cardinalItem && psSearch) {
    //   query.orderStatus = "UPDATED";
    // }
    // 검색결과없으면 schedule
    query.lastUpdated = dayjs();
    return await DailyOrder.findOneAndUpdate(
      {
        _id: dailyOrder._id,
      },
      query
    );
  } catch (e) {
    console.log(e);
  }
};
