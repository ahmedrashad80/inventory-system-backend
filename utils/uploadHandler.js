import ImageKit from "imagekit";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const handleImageUpload = async (req) => {
  if (!req.files || req.files.length === 0) return [];

  const uploadedImages = [];

  for (let file of req.files) {
    const filePath = file.path;

    const image = await imagekit.upload({
      file: fs.readFileSync(filePath), // محتوى الصورة
      fileName: file.filename, // اسم الملف
      folder: "/ecommerce-images", // مجلد داخل ImageKit
    });

    uploadedImages.push(image.url);

    // احذف الصورة المحلية بعد الرفع
    fs.unlinkSync(filePath);
  }

  return uploadedImages;
};
