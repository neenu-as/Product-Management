const mongoose = require("mongoose");

const VariantSchema = new mongoose.Schema({
  ram: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, required: true }
});

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  description: { type: String },
  variants: [VariantSchema],
  images: [String], // store image file paths or URLs
});

module.exports = mongoose.model("Product", ProductSchema);
