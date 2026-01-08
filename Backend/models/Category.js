const mongoose = require("mongoose");

const SubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true }
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subCategories: [SubCategorySchema]
});

module.exports = mongoose.model("Category", CategorySchema);
