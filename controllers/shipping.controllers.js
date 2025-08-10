import Shipping from "../models/shipping.model.js";

// جلب كل المحافظات وتكلفة الشحن
export const getAllGovernorates = async (req, res) => {
  try {
    const shipping = await Shipping.findOne();
    if (!shipping)
      return res.status(404).json({ message: "لا توجد بيانات شحن" });
    res.status(200).json(shipping.governorates);
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطأ في جلب المحافظات", error: error.message });
  }
};

// تحديث تكلفة الشحن لمحافظة معينة
export const updateShippingCost = async (req, res) => {
  const { name, shippingCost } = req.body;
  try {
    const shipping = await Shipping.findOne();
    if (!shipping)
      return res.status(404).json({ message: "لا توجد بيانات شحن" });

    const gov = shipping.governorates.find((g) => g.name === name);
    if (!gov) return res.status(404).json({ message: "المحافظة غير موجودة" });

    gov.shippingCost = shippingCost;
    await shipping.save();
    res.status(200).json({
      message: "تم تحديث تكلفة الشحن بنجاح",
      governorates: shipping.governorates,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطأ في تحديث تكلفة الشحن", error: error.message });
  }
};

// get cost according to name
export const getShippingCostByName = async (req, res) => {
  const { name } = req.params;
  try {
    const shipping = await Shipping.findOne();
    if (!shipping)
      return res.status(404).json({ message: "لا توجد بيانات شحن" });
    const governorate = shipping.governorates.find((g) => g.name === name);
    if (!governorate)
      return res.status(404).json({ message: "المحافظة غير موجودة" });
    res
      .status(200)
      .json({
        message: "تم جلب تكلفة الشحن بنجاح",
        cost: governorate.shippingCost,
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطاء في جلب تكلفة الشحن", error: error.message });
  }
};

// // يمكنك وضع هذا الكود في ملف منفصل أو في index.js مرة واحدة فقط
// import Shipping from "./models/shipping.model.js";

// const EGYPTIAN_GOVERNORATES = [
//   "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
//   "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
//   "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد",
//   "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
//   "قنا", "شمال سيناء", "سوهاج"
// ];

// async function seedGovernorates() {
//   const shipping = await Shipping.findOne();
//   if (!shipping) {
//     await Shipping.create({
//       governorates: EGYPTIAN_GOVERNORATES.map(name => ({
//         name,
//         shippingCost: 0 // أو أي قيمة افتراضية
//       }))
//     });
//     console.log("تمت إضافة المحافظات المصرية بنجاح");
//   }
// }
// seedGovernorates();
