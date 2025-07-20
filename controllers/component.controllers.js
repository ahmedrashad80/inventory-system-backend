import Component from "../models/Component.model.js";
import ComponentMovement from "../models/componentMovement.model.js";
import { handleImageUpload } from "../utils/uploadHandler.js";
// إنشاء مكون جديد
export const createComponent = async (req, res) => {
  try {
    const { code, name, quantity, unit_price, supplier } = req.body;
    const imagePath = handleImageUpload(req);
    const component = new Component({
      code,
      name,
      quantity,
      unit_price,
      supplier,
      image: imagePath,
    });

    await component.save();
    res.status(201).json(component);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// جلب كل المكونات
export const getAllComponents = async (req, res) => {
  try {
    const components = await Component.find();
    res.status(200).json(components);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, quantity, unit_price, supplier, reason } = req.body;

    // ابحث عن المكون الحالي
    const component = await Component.findById(id);
    if (!component) {
      return res.status(404).json({ message: "المكون غير موجود" });
    }

    // حفظ القيم القديمة للتسجيل في الحركة
    const oldComponent = {
      code: component.code,
      name: component.name,
      quantity: component.quantity,
      unit_price: component.unit_price,
      supplier: component.supplier,
      image: component.image,
    };

    // تحديث الصورة لو تم رفع صورة جديدة
    const imagePath = handleImageUpload(req);
    if (imagePath) {
      component.image = imagePath;
    }

    // تحديث باقي الحقول
    if (code) component.code = code;
    if (name) component.name = name;
    if (quantity !== undefined) component.quantity = quantity;
    if (unit_price !== undefined) component.unit_price = unit_price;
    if (supplier) component.supplier = supplier;
    if (reason) component.reason = reason;

    await component.save();

    // استخراج الحقول التي تغيرت فقط
    const changedFields = {};
    Object.keys(oldComponent).forEach((key) => {
      if (component[key] !== oldComponent[key]) {
        changedFields[key] = { from: oldComponent[key], to: component[key] };
      }
    });

    // حساب الفرق في الكمية فقط إذا تغيرت
    let quantityDiff = 0;
    if (changedFields.hasOwnProperty("quantity")) {
      quantityDiff = component.quantity - oldComponent.quantity;
    }

    // تسجيل حركة التعديل في ComponentMovement فقط إذا كان هناك تغيير
    if (Object.keys(changedFields).length > 0) {
      await ComponentMovement.create({
        component: component._id,
        type: "update",
        quantity: quantityDiff,
        reason: reason || "تعديل يدوي للمكون",
        notes: Object.keys(changedFields)
          .map(
            (key) =>
              `${key}: من "${changedFields[key].from}" إلى "${changedFields[key].to}"`
          )
          .join(" | "),
        related_product: null,
      });
    }

    res.status(200).json(component);
  } catch (error) {
    res.status(500).json({
      message: "error updating component",
      error: error.message,
    });
  }
};

// حذف مكون
export const deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const component = await Component.findByIdAndDelete(id);
    if (!component) {
      return res.status(404).json({ message: "المكون غير موجود" });
    }
    res.status(200).json({ message: "تم حذف المكون بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// إضافة كمية للمخزون

export const stockInComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason, notes } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "يرجى إدخال كمية صالحة" });
    }

    // تحديث الكمية في المخزن
    const component = await Component.findByIdAndUpdate(
      id,
      { $inc: { quantity: quantity } },
      { new: true }
    );

    if (!component) {
      return res.status(404).json({ message: "المكون غير موجود" });
    }

    // تسجيل حركة في جدول ComponentMovement
    await ComponentMovement.create({
      component: component._id,
      type: "in",
      quantity,
      reason: reason || "إدخال مخزون جديد",
      related_product: null,
    });

    res.status(200).json({
      message: "تم تحديث المخزون وتسجيل الحركة بنجاح",
      component,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إدخال المخزون", error: error.message });
  }
};

// تعديل يدوي بعد الجرد

export const adjustComponentStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { newQuantity, reason } = req.body;

    // التحقق من صحة القيمة
    if (typeof newQuantity !== "number" || newQuantity < 0) {
      return res.status(400).json({ message: "قيمة الكمية غير صالحة" });
    }

    const component = await Component.findById(id);
    if (!component) {
      return res.status(404).json({ message: "المكون غير موجود" });
    }

    const oldQuantity = component.quantity;
    if (newQuantity === oldQuantity) {
      return res
        .status(400)
        .json({ message: "الكمية الجديدة مساوية للقديمة، لا يوجد تغيير" });
    }

    const difference = newQuantity - oldQuantity;

    // تحديث الكمية
    component.quantity = newQuantity;
    await component.save();

    // تسجيل حركة التعديل
    await ComponentMovement.create({
      component: component._id,
      type: difference > 0 ? "in" : "out",
      quantity: Math.abs(difference),
      reason: reason || "تعديل يدوي للمخزون",
      related_product: null,
    });

    res.status(200).json({
      message: "تم تعديل الكمية بنجاح",
      oldQuantity,
      newQuantity,
      component,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "خطأ أثناء تعديل المخزون", error: error.message });
  }
};

//جلب كل بيانات حركه المكوناتن

export const getComponentMovements = async (req, res) => {
  try {
    const movements = await ComponentMovement.find()
      .populate("component", "name code")
      .populate("related_product", "name code")
      .sort({ date: -1 });

    if (movements.length === 0) {
      return res.status(404).json({ message: "لا توجد حركات للمكونات" });
    }

    res.status(200).json({
      message: "تم جلب حركات المكونات بنجاح",
      count: movements.length,
      movements,
    });
  } catch (error) {
    res.status(500).json({ message: "فشل في جلب حركات المكونات", error });
  }
};
