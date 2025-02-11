const { hyphenateNDC11 } = require("../../convert");

const cahNoData = "— —";
const enumPending = "PENDING";
const enumBrand = "BRAND";
const enumNoContract = "NO CONTRACT";
const mapCAHTooltipData = (product) => {
  const brandName = product.brandName;
  return {
    name: product.name,
    brandName,
    mfr: product.mfr,
    contract:
      product.contract ?? brandName === cahNoData ? enumNoContract : enumBrand, //
    stockStatus: product.stockStatus,
    stock: product.stock,
    rebateEligible: product.rebateEligible === "done",
    returnable: product.returnable === "done",
    cin: product.cin,
    ndc: product.ndc,
    lastOrdered: product.lastOrdered,
    lastCost: product.analysis.lastCost ?? cahNoData,
    lowestHistCost: product.analysis.lowestHistCost ?? cahNoData,
    lastSFDCDate: product.analysis.lastSFDCDate ?? cahNoData,
    lastSFDCCost: product.analysis.lastSFDCCost ?? cahNoData,
  };
};
const mapPsItem = (psItem) => ({
  description: psItem.description,
  pkgPrice: psItem.pkgPrice,
  ndc: hyphenateNDC11(psItem.ndc),
  qtyAvl: psItem.qtyAvl,
  unitPrice: psItem.unitPrice,
  lotExpDate: psItem.lotExpDate,
  wholesaler: psItem.wholesaler,
  manufacturer: psItem.manufacturer,
});

module.exports = (v) => {
  // TODO: when status become "UPDATED", save the result as a document field.
  const result = {};
  // time
  result.time = v.date;
  // package
  const package = v.package;
  const alternative = package.alternative;
  result.package = {};
  result.package.title = package.name
    ? package.name
    : package.ndc11
    ? package.ndc11
    : package.gtin;
  result.package.subtitle = package.mfrName
    ? package.mfrName
    : package.manufacturerName
    ? package.manufacturerName
    : package.labeler_name
    ? package.labeler_name
    : "";
  // qty
  result.qty = {};
  result.qty.title = v.items.length;
  // const stock = package.inventories.length;
  // const optimalStock = package.optimalStock;
  // cah
  const cahPrd = package.cardinalProduct;
  const cahSrc = alternative?.cardinalSource;
  if (cahSrc) {
    if (cahSrc.active) {
      if (cahSrc.contract) {
        result.cahSource = {
          title: cahSrc.estNetCost,
          subtitle: cahSrc.netUoiCost,
          tooltip: {
            lastUpdated: cahSrc.lastUpdated,
            data: mapCAHTooltipData(cahSrc),
          },
        };
      } else if (!cahPrd || cahPrd.active === false) {
        resultcahSource = { title: "NA*" };
        // add tooltip
      }
    }
    if (!result.cahSource) {
      result.cahSource = "NA";
    }
  } else {
    result.cahSource = enumPending;
  }
  if (cahPrd) {
    if (cahPrd.active) {
      result.cahProduct = {};
      result.cahProduct.title = cahPrd.estNetCost;
      result.cahProduct.subtitle = cahPrd.netUoiCost;
      const source = cahPrd.analysis.source;
      if (source.ndc) {
        if (
          !(typeof result.cahSource === "object" && source.ndc === cahSrc.ndc)
        ) {
          if (source.contract) {
            result.cahSource = {
              title: source.estNetCost,
              subtitle: source.netUoiCost,
              // tooltip: { data: "PENDING" },
            };
          } else {
            if (cahPrd.brandName === cahNoData) {
              result.cahSource = { title: "NA*" };
            } else {
              // if generic availble BRAND*
              // else
              result.cahSource = { title: enumBrand };
              result.cahProduct.tooltip = {
                lastUpdated: cahPrd.lastUpdated,
                data: mapCAHTooltipData(cahPrd),
              };
            }
            //add tooltip
          }
        }
      } else {
        result.cahProduct.tooltip = {
          lastUpdated: cahPrd.lastUpdated,
          data: mapCAHTooltipData(cahPrd),
        };
        const contract = cahPrd.contract;
        if (contract) {
          result.cahSource = { title: contract };
        } else {
          result.cahSource = "NA";
        }
      }
    } else {
      result.cahProduct = "NA";
    }
  } else {
    result.cahProduct = enumPending;
  }
  // ps
  let psItem = package.psItem;
  if (result.cahSource.subtitle) {
    // const { Package } = require("../../schemas/inventory");
    if (alternative) {
      psItem = alternative.sourcePackage.psItem;
    }
  }
  if (psItem) {
    if (psItem.active) {
      result.psItem = {};
      result.psItem.title = psItem.pkgPrice;
      result.psItem.subtitle = psItem.unitPrice;
      result.psItem.tooltip = {
        lastUpdated: psItem.lastUpdated,
        data: mapPsItem(psItem),
      };
    } else {
      result.psItem = "NA";
    }
  } else {
    result.psItem = enumPending;
  }
  const psSearch = alternative?.psSearch;
  if (psSearch) {
    if (psSearch.active) {
      let item;
      let size;
      result.psSearch = {};
      // if cardinal is undefined item = results[0]
      if (cahPrd || cahSrc) {
        if (result.psItem.title) {
          size = psItem.pkg;
        } else if (result.cahSource.subtitle) {
          // add convert method
          let _size = 1;
          cahSrc.size.match(/[\d.]+/g).forEach((v) => (_size *= Number(v)));
          size = _size.toString();
        } else if (result.cahProduct.title) {
          let _size = 1;
          cahPrd.size.match(/[\d.]+/g).forEach((v) => (_size *= Number(v)));
          size = _size.toString();
        } else {
          // check pkg size
        }
      }
      item = psSearch.results.filter((v) => v.pkg === size)[0];
      if (!item) {
        item = psSearch.results[0];
      }
      result.psSearch.title = item.pkgPrice;
      result.psSearch.subtitle = item.unitPrice;
    } else {
      result.psSearch = "NA";
    }
  } else {
    result.psSearch = enumPending;
  }

  return result;
};
