const CardinalInvoice = require("../../schemas/cardinal/cardinalInvoice");

const omitCodes = {
  1: "RESTRICTED CODE",
  2: "DC DISCONTINUED",
  3: "MFG DISCONTINUED",
  4: "DROPSHIP",
  5: "AVAILABILITY ISSUE",
  "5A": "NEW ITEM",
  "5B": "NON STOCK",
  6: "TEMP OUT",
};

module.exports = async (invoices) => {
  //   const {
  //     invoiceDate,
  //     invoiceType,
  //     item,
  //     tradeName,
  //     origQty,
  //     orderQty,
  //     shipQty,
  //     omitCode,
  //     cost,
  //   } = invoice;

  const priceChangedItems = [];
  try {
    // // Eval 1: Find a previous invoice with the same item and compare their costs
    // //이역시 인보이스를 배열평탄화해야할듯 .... spread문법사용하자
    // for (let i = 0; i < item.length; i++) {
    //   const result = CardinalInvoice.findOne({
    //     item: item[i],
    //     invoiceDate: { $lt: invoiceDate },
    //   });
    //   let prevCost = Number(result.cost[i].replace(/[^0-9.-]+/g, ""));
    //   if (result) {
    //     const indices = [];
    //     result.item.forEach((v, i) => {
    //       if (v === item[i]) {
    //         indices.push(i);
    //       }
    //     });
    //     if (indices.length > 1) {
    //       const costs = [];
    //       indices.forEach((v) => {
    //         costs.push(Number(result.cost[v].replace(/[^0-9.-]+/g, "")));
    //       });
    //       prevCost = Math.max(...costs);
    //     }
    //     if (result.cost[i] !== cost[i]) {
    //       priceChangedItems.push({
    //         item: item[i],
    //         costNow: Number(cost[i].replace(/[^0-9.-]+/g, "")),
    //         prevCost: prevCost,
    //         prevInvoiceDate: result.invoiceDate,
    //       });
    //     }
    //   }
    // }
  } catch (e) {
    console.log(e);
    return;
  }

  return;
};

// 기능 1: checkStatus 에따라 체크안됫음을 확인 => 스케쥴잡으로 자동체크도 추가한다
// 기능 2: 동일아이템에 다른가격으로 왔을경우 보고 =>이것은 모든 인보이스를 한번에 확인해야하므로 모듈밖에서 짠다
// 기능 3: 주문수량과 배송수량이 다르면 보고
