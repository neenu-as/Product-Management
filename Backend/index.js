const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

const User = require("./models/User");
const Category = require("./models/Category");
const Product = require("./models/Product");

const app = express();
const PORT = 5000;

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // future use for images

// ---------------- MULTER SETUP ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---------------- MONGOOSE CONNECTION ----------------
mongoose.connect("mongodb://127.0.0.1:27017/productiondb")
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.log("MongoDB connection error:", err));

// ---------------- TEST ROUTE ----------------
app.get("/", (req, res) => res.send("Backend is running"));

// ---------------- USER ROUTES ----------------

// Signup
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, "secretKey", { expiresIn: "1d" });

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});













// ------------------ CATEGORY ROUTES ------------------
app.get("/categories", async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
});

app.post("/categories", async (req, res) => {
  const { name } = req.body;
  const newCat = new Category({ name, subCategories: [] });
  await newCat.save();
  res.json(newCat);
});

app.post("/categories/:id/subcategories", async (req, res) => {
  const { name } = req.body;
  const category = await Category.findById(req.params.id);
  category.subCategories.push({ name });
  await category.save();
  res.json(category);
});

// ------------------ PRODUCT ROUTES ------------------
app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});



// Get single product by ID
// app.get("/products/:id", async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     res.json(product);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

app.get("/products/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});
// /update

app.put("/products/:id", upload.array("images"), async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    let updatedImages = existing.images;

    // only replace images if user uploads new ones
    if (req.files && req.files.length > 0) {
      updatedImages = req.files.map(f => `/uploads/${f.filename}`);
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        category: req.body.category,
        subCategory: req.body.subCategory,
        description: req.body.description,
        variants: JSON.parse(req.body.variants),
        images: updatedImages
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json(err);
  }
});







// ---------------- CREATE PRODUCT ----------------
app.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const { title, category, subCategory, description, variants } = req.body;

    // Multer stores uploaded files in req.files
    const images = req.files.map(file => `/uploads/${file.filename}`);

    // Save product
    const product = new Product({
      title,
      category,
      subCategory,
      description,
      variants: JSON.parse(variants), // because variants sent as JSON string
      images
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }
});











// ---------------- START SERVER ----------------
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
