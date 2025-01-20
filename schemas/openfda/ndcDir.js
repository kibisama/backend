const mongoose = require("mongoose");
const { Schema } = mongoose;

const ndcDirSchema = new Schema({
  lastRetrieved: Date,
  /* Not listed in the official Searchable Fields document */
  labeler_name: String,
  /* Key fields */
  packaging: [
    {
      package_ndc: String,
      description: String,
      marketing_start_date: String,
      marketing_end_date: String,
      sample: Boolean,
    },
  ],
  /* Searchable fields */
  product_id: String,
  product_ndc: String,
  spl_id: String,
  product_type: String,
  finished: Boolean,
  brand_name: String,
  brand_name_base: String,
  brand_name_suffix: String,
  generic_name: String,
  dosage_form: String,
  route: [String],
  marketing_start_date: String,
  marketing_end_date: String,
  marketing_category: String,
  application_number: String,
  pharm_class: [String],
  dea_schedule: String,
  listing_expiration_date: String,
  active_ingredients: [{ name: String, strength: String }],
  openfda: {
    is_original_packager: [Boolean],
    manufacturer_name: [String],
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
});

module.exports = mongoose.model("NDC Directory", ndcDirSchema);
