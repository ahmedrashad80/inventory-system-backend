import Product from "../models/product.model.js";
import { handleImageUpload } from "../utils/uploadHandler.js";
import ImageKit from "imagekit";
import dotenv from "dotenv";
dotenv.config();

// إنشاء instance من ImageKit
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

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
    const {
      code,
      name,
      description,
      components,
      price,
      oldImages,
      deletedImages,
    } = req.body;

    // التعامل مع الصور الجديدة من Multer
    const newImages = await handleImageUpload(req);

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

    // تحديث الحقول الأساسية
    if (price) product.price = price;
    if (code) product.code = code;
    if (name) product.name = name;
    if (description !== undefined) product.description = description;

    // تحديث المكونات
    if (components) {
      const parsedComponents =
        typeof components === "string" ? JSON.parse(components) : components;
      product.components = parsedComponents;
    }

    // التعامل مع الصور
    let finalImages = [];

    // إضافة الصور القديمة المحتفظ بها
    if (oldImages) {
      try {
        const parsedOldImages =
          typeof oldImages === "string" ? JSON.parse(oldImages) : oldImages;
        finalImages = [...parsedOldImages];
      } catch (error) {
        console.log("خطأ في تحليل الصور القديمة:", error);
      }
    }

    // إضافة الصور الجديدة إذا كانت موجودة
    if (newImages && newImages.length > 0) {
      finalImages = [...finalImages, ...newImages];
    }

    // تحديث مصفوفة الصور
    product.image = finalImages;

    // حذف الصور المحذوفة من النظام (اختياري)
    if (deletedImages) {
      try {
        const parsedDeletedImages =
          typeof deletedImages === "string"
            ? JSON.parse(deletedImages)
            : deletedImages;

        // حذف الصور بالبحث عن اسم الملف
        for (const imagePath of parsedDeletedImages) {
          try {
            // استخراج اسم الملف من الرابط
            const fileName = imagePath.split("/").pop().split("?")[0];

            // البحث عن الملف باستخدام instance
            const files = await imagekit.listFiles({
              searchQuery: `name="${fileName}"`,
              limit: 1,
            });

            if (files.length > 0) {
              await imagekit.deleteFile(files[0].fileId);
              console.log(`تم حذف الصورة: ${fileName}`);
            } else {
              console.log(`لم يتم العثور على الصورة: ${fileName}`);
            }
          } catch (error) {
            console.log(`فشل حذف الصورة:`, error);
          }
        }

        // console.log("الصور المحذوفة:", parsedDeletedImages);
      } catch (error) {
        console.log("خطأ في تحليل الصور المحذوفة:", error);
      }
    }

    await product.save();
    res.status(200).json(product);
  } catch (error) {
    console.error("خطأ في تحديث المنتج:", error);
    res.status(500).json({
      message: "فشل في تعديل المنتج",
      error: error.message,
    });
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
