const { hyphenateNDC11 } = require("../../convert");

const ENUM = {
  CAH_NO_DATA: "— —",
  CAH_PRODUCT_TYPE_BRAND: "Branded Drug",
  CAH_PRODUCT_TYPE_GENERIC: "Generic Drug",
  PENDING: "PENDING",
  NA: "NA",
  BRAND: "BRAND",
  NO_CONTRACT: "NO CONTRACT",
};

const mapCAHTooltipData = (product) => {
  const brandName = product.brandName;
  return {
    name: product.name,
    brandName,
    mfr: product.mfr,
    contract:
      product.contract ??
      (brandName === ENUM.CAH_NO_DATA ? ENUM.NO_CONTRACT : ENUM.BRAND),
    stockStatus: product.stockStatus,
    stock: product.stock,
    rebateEligible: product.rebateEligible === "done",
    returnable: product.returnable === "done",
    cin: product.cin,
    ndc: product.ndc,
    lastOrdered: product.lastOrdered,
    lastCost: product.analysis.lastCost ?? ENUM.CAH_NO_DATA,
    lowestHistCost: product.analysis.lowestHistCost ?? ENUM.CAH_NO_DATA,
    lastSFDCDate: product.analysis.lastSFDCDate ?? ENUM.CAH_NO_DATA,
    lastSFDCCost: product.analysis.lastSFDCCost ?? ENUM.CAH_NO_DATA,
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
      result.cahSource = ENUM.NA;
    }
  } else {
    result.cahSource = ENUM.PENDING;
  }
  let _source;
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
          _source = source;
          if (source.contract) {
            result.cahSource = {
              title: source.estNetCost,
              subtitle: source.netUoiCost,
              // tooltip: { data: "PENDING" },
            };
          } else {
            if (
              cahPrd.brandName === ENUM.CAH_NO_DATA ||
              cahPrd.productType === ENUM.CAH_PRODUCT_TYPE_GENERIC
            ) {
              result.cahSource = { title: "NA*" };
            } else {
              // if generic availble BRAND*
              // else
              result.cahSource = { title: ENUM.BRAND };
              result.cahProduct.tooltip = {
                lastUpdated: cahPrd.lastUpdated,
                data: mapCAHTooltipData(cahPrd),
              };
            }
            //add tooltip
          }
        } else if (
          cahPrd.brandName !== ENUM.CAH_NO_DATA ||
          cahPrd.productType === ENUM.CAH_PRODUCT_TYPE_BRAND
        ) {
          result.cahProduct.tooltip = {
            lastUpdated: cahPrd.lastUpdated,
            data: mapCAHTooltipData(cahPrd),
          };
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
          result.cahSource = ENUM.NA;
        }
      }
    } else {
      result.cahProduct = ENUM.NA;
    }
  } else {
    result.cahProduct = ENUM.PENDING;
  }
  // ps
  let psItem;
  if (_source) {
    if (_source.ndc.replaceAll("-", "") === alternative?.sourcePackage?.ndc) {
      psItem = alternative.sourcePackage.psItem;
    }
  } else {
    if (alternative?.sourcePackage) {
      psItem = alternative.sourcePackage.psItem;
    } else {
      psItem = package.psItem;
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
      result.psItem = ENUM.NA;
    }
  } else {
    result.psItem = ENUM.PENDING;
  }
  const psSearch = alternative?.psSearch;
  if (psSearch) {
    if (psSearch.active) {
      let item;
      let size;
      result.psSearch = {};
      if (!_source) {
        let _size = 1;
        if (cahSrc) {
          cahSrc.size.match(/[\d.]+/g).forEach((v) => (_size *= Number(v)));
          size = _size.toString();
        } else if (cahPrd) {
          cahPrd.size.match(/[\d.]+/g).forEach((v) => (_size *= Number(v)));
          size = _size.toString();
        } else {
          //check pkg size
        }
      }
      item = psSearch.results.filter((v) => v.pkg === size)[0];
      if (!item) {
        item = psSearch.results[0];
      }
      result.psSearch.title = item.pkgPrice;
      result.psSearch.subtitle = item.unitPrice;
      result.psSearch.tooltip = {
        lastUpdated: psSearch.lastUpdated,
        data: psSearch.results.map((v) => mapPsItem(v)),
      };
    } else {
      result.psSearch = ENUM.NA;
    }
  } else {
    result.psSearch = ENUM.PENDING;
  }

  return result;
};
