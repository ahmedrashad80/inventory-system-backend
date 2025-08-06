import Product from "../models/product.model.js";
import { handleImageUpload } from "../utils/uploadHandler.js";

// ➕ إضافة منتج جديد
export const createProduct = async (req, res) => {
  try {
    const { code, name, description, components, price } = req.body;
    const image = await handleImageUpload(req);

    // تأكد أن المكونات في شكل JSON إذا أتت كـ String
    const parsedComponents =
      typeof components === "string" ? JSON.parse(components) : components;

    const product = new Product({
      code,
      name,
      description,
      image,
      price,
      components: parsedComponents,
    });

    await product.save();

    res.status(201).json(product);
  } catch (error) {
    console.error("❌ Error creating product:", error);
    res
      .status(500)
      .json({ message: "فشل في إنشاء المنتج", error: error.message });
  }
};

// 📄 عرض كل المنتجات + مكوناتهم
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("components.component");

    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب المنتجات", error: error.message });
  }
};

// ✏️ تعديل منتج
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, description, components, price } = req.body;
    const image = await handleImageUpload(req);

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    if (image) product.image = image;
    if (price) product.price = price;
    if (code) product.code = code;
    if (name) product.name = name;
    if (description) product.description = description;

    if (components) {
      const parsedComponents =
        typeof components === "string" ? JSON.parse(components) : components;
      product.components = parsedComponents;
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في تعديل المنتج", error: error.message });
  }
};

// 🗑️ حذف منتج
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    res.status(200).json({ message: "تم الحذف بنجاح" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في حذف المنتج", error: error.message });
  }
};

// get product by id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate("components.component");
    if (!product) {
      return res.status(404).json({ message: "المنتج غير موجود." });
    }
    res.status(200).json({
      message: "تم جلب المنتج بنجاح.",
      product,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب المنتج", error: error.message });
  }
};
