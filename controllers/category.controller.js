import Category from "../models/category.model.js";

//  إنشاء قسم جديد
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: "يوجد قسم بنفس الاسم" });
        }

        const category = new Category({ name });
        await category.save();

        res.status(201).json({ message: "تم إنشاء القسم بنجاح", category });
    } catch (error) {
        res.status(500).json({ message: "فشل في إنشاء القسم", error: error.message });
    }
};

//  جلب كل الأقسام
export const getAllCategories = async (req, res) => {
    try {
        const { activeOnly } = req.query;
        const query = activeOnly === "true" ? { isActive: true } : {};
        const categories = await Category.find(query).sort({ createdAt: -1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: "فشل في جلب الأقسام", error: error.message });
    }
};

//  تعديل قسم
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;

        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ message: "القسم غير موجود" });
        }

        if (name && name !== category.name) {
            const existing = await Category.findOne({ name });
            if (existing) {
                return res.status(400).json({ message: "يوجد قسم بنفس الاسم" });
            }
            category.name = name;
        }

        if (isActive !== undefined) category.isActive = isActive;

        await category.save();
        res.status(200).json({ message: "تم تحديث القسم بنجاح", category });
    } catch (error) {
        res.status(500).json({ message: "فشل في تعديل القسم", error: error.message });
    }
};

//  حذف قسم
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndDelete(id);
        if (!category) {
            return res.status(404).json({ message: "القسم غير موجود" });
        }
        res.status(200).json({ message: "تم حذف القسم بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "فشل في حذف القسم", error: error.message });
    }
};
