const mongoose = require("mongoose");
const { Schema } = mongoose;

const ndcDirSchema = new Schema({
  lastRetrieved: Date,
  product_ndc: String,
  generic_name: String,
  labeler_name: String,
  brand_name: String,
  active_ingredients: [{ name: String, strength: String }],
  finished: Boolean,
  packaging: [
    {
      package_ndc: String,
      description: String,
      marketing_start_date: String,
      sample: Boolean,
    },
  ],
  listing_expiration_date: String,
  openfda: {
    manufacturer_name: [String],
    is_original_packager: [Boolean],
    nui: [String],
    pharm_class_cs: [String],
    pharm_class_epc: [String],
    pharm_class_moa: [String],
    pharm_class_pe: [String],
    rxcui: [String],
    spl_set_id: [String],
    unii: [String],
    upc: [String],
  },
  marketing_category: String,
  dosage_form: String,
  spl_id: String,
  product_type: String,
  route: [String],
  marketing_start_date: String,
  product_id: String,
  application_number: String,
  brand_name_base: String,
});

module.exports = mongoose.model("NDC Directory", ndcDirSchema);
