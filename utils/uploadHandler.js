// رفع محلي مؤقت - يرجع فقط مسار الصورة المحفوظ
export const handleImageUpload = (req) => {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }
  return ""; // لو مفيش صورة
};
// 📌 لاحقًا لما نحول لـ Cloudinary:

// هنغير هذا الملف فقط، مش باقي الكود.
