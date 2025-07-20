import multer from "multer";
import path from "path";
import fs from "fs";

// نتأكد إن مجلد uploads موجود
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// إعداد التخزين المحلي
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, filename);
  },
});

// فلتر لقبول الصور فقط
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("الملف المرفوع يجب أن يكون صورة"), false);
  }
};

const upload = multer({ storage, fileFilter });

export default upload;
