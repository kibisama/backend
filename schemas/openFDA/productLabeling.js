const mongoose = require("mongoose");
const { Schema } = mongoose;

const productLabelingSchema = new Schema({
  lastRetrieved: Date,
  /* Selected Searchable Fields */
  id: String,
  effective_time: String,
  set_id: String,
  version: String,
  openfda: {
    application_number: [String],
    brand_name: [String],
    generic_name: [String],
    manufacturer_name: [String],
    nui: [String],
    package_ndc: [String],
    pharm_class_cs: [String],
    pharm_class_epc: [String],
    pharm_class_moa: [String],
    pharm_class_pe: [String],
    product_ndc: [String],
    product_type: [String],
    route: [String],
    rxcui: [String],
    spl_id: [String],
    spl_set_id: [String],
    substance_name: [String],
    unii: [String],
    upc: [String],
    /* Not listed in the official Searchable Fields document */
    original_packager_product_ndc: [String],
  },
});

module.exports = mongoose.model("Product Labeling", productLabelingSchema);
