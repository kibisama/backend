module.exports = (data) =>
  data.map((v, i) => {
    return {
      hierarchy: 0,
      id: v._id,
      label: v.name,
      dea_schedule: v.dea_schedule,
      children: v.families.map((w, j) => {
        return {
          hierarchy: 1,
          id: w._id,
          label: w.name,
          // optimalQty: w.optimalQty,
          // unit: w.unit,
          children: w.alternatives.map((x, k) => {
            return {
              hierarchy: 2,
              id: x._id,
              label: x.name,
              ndc11: x.ndc11,
              // dosage_form: x.dosage_form,
              // size: x.size,
              // unit: x.unit,
              preferred: x.preferred,
              count: x.inventories?.length,
              optimalQty: x.optimalQty,
              children: [
                {
                  hierarchy: 3,
                  id: `${i.toString()}.${j.toString()}.${k.toString()}`,
                  label: "",
                  data: x.inventories,
                },
              ],
            };
          }),
        };
      }),
    };
  });
