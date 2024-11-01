const mongoose = require("mongoose");
const { Schema } = mongoose;

const productLabelingSchema = new Schema({
  lastRetrieved: Date,
  id: { type: String, unique: true },
  effective_time: String,
  version: Number,
  openfda: {
    application_number: [String],
    brand_name: [{ type: String, uppercase: true }],
    generic_name: [{ type: String, uppercase: true }],
    manufacturer_name: [{ type: String, uppercase: true }],
    product_ndc: [String],
    product_type: [String],
    route: [String],
    substance_name: [{ type: String, uppercase: true }],
    rxcui: [String],
    spl_id: [String],
    spl_set_id: [String],
    package_ndc: [String],
    original_packager_product_ndc: [String],
    upc: [String],
    unii: [String],
  },
});

module.exports = mongoose.model("Product Labeling", productLabelingSchema);
