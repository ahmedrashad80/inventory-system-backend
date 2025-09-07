import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Component from "../models/component.model.js";
import ComponentMovement from "../models/componentMovement.model.js";
import ManufacturingRecord from "../models/ManufacturingRecord.model.js";
import ProductUnit from "../models/productUnit.model.js";
import salesModel from "../models/sales.model.js";

export const manufactureProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productId, quantity, notes, created_by } = req.body;

    // 1. Find product and populate its components
    const product = await Product.findById(productId)
      .populate("components.component")
      .session(session);

    if (!product) throw new Error("المنتج غير موجود");

    // 2. Generate batch number
    const batch_no = `${product.code}-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.floor(Math.random() * 1000)}`;

    // 3. Validate component availability
    for (const item of product.components) {
      const requiredQty = item.quantity_required * quantity;
      if (item.component.quantity < requiredQty) {
        throw new Error(`المكون ${item.component.name} غير كافٍ في المخزن`);
      }
    }

    // 4. Deduct quantities and log movements
    for (const item of product.components) {
      const totalToDeduct = item.quantity_required * quantity;

      await Component.findByIdAndUpdate(
        item.component._id,
        { $inc: { quantity: -totalToDeduct } },
        { session }
      );

      await ComponentMovement.create(
        [
          {
            component: item.component._id,
            type: "out",
            quantity: totalToDeduct,
            reason: "تصنيع منتج",
            related_product: product._id,
          },
        ],
        { session }
      );
    }

    // 5. Create product units
    const productUnits = [];
    for (let i = 1; i <= quantity; i++) {
      const serial_number = `${batch_no}-${i.toString().padStart(3, "0")}`;
      productUnits.push({
        serial_number,
        product: product._id,
        batch_no,
        status: "جاهز",
      });
    }

    await ProductUnit.insertMany(productUnits, { session });

    // 6. Log manufacturing record
    await ManufacturingRecord.create(
      [
        {
          product: product._id,
          product_code: product.code,
          batch_no,
          quantity_produced: quantity,
          notes,
          created_by,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({
      message: "تم التصنيع بنجاح",
      units: productUnits,
      batch_no,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: "فشل التصنيع", error: error.message });
  } finally {
    session.endSession();
  }
};

export const getAllManufacturedProducts = async (req, res) => {
  try {
    const records = await ManufacturingRecord.find()
      .populate("product", "name code") // Populate product with name and code
      .populate("created_by", "name")
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: "فشل في جلب سجلات التصنيع", error });
  }
};

export const getUnitsByBatchNumber = async (req, res) => {
  try {
    const { batchNo } = req.params;
    const units = await ProductUnit.find({ batch_no: batchNo }).sort({
      serial_number: 1,
    });
    if (units.length === 0) {
      return res.status(404).json({ message: "لا توجد وحدات لهذا الدفعة" });
    }
    res.status(200).json({
      message: "تم جلب الوحدات بنجاح",
      batch_no: batchNo,
      units,
    });
  } catch (error) {
    res.status(500).json({
      message: "فشل في جلب الوحدات",
      error: error.message,
    });
  }
};

export const getAllProductsUnits = async (req, res) => {
  try {
    const units = await ProductUnit.find()
      .populate("product", "_id name code description price")
      .sort({ date_produced: -1 });

    // for (const unit of units) {
    //   if (!unit.product) {
    //     await ProductUnit.findByIdAndDelete(unit._id);
    //   }
    // }

    const productCounts = units.reduce((acc, unit) => {
      if (!unit.product) return acc; // skip if product not found

      const productId = unit.product._id.toString();

      if (acc[productId]) {
        acc[productId].count += 1;
        acc[productId].units.push(unit._id);
      } else {
        acc[productId] = {
          count: 1,
          product: unit.product,
          units: [unit._id],
        };
      }

      return acc;
    }, {});

    for (const key in productCounts) {
      productCounts[key].units.reverse();
    }

    const totalUnits = Object.values(productCounts).reduce(
      (total, item) => total + item.count,
      0
    );
    res.status(200).json({
      message: "تم جلب جميع وحدات المنتجات بنجاح",
      total: totalUnits,
      units,
      productCounts,
    });
  } catch (error) {
    res.status(500).json({
      message: "فشل في جلب وحدات المنتج",
      error,
    });
  }
};

export const sellSelectedUnits = async (req, res) => {
  try {
    const { items } = req.body;
    // items: [{ productId, unitIds: [] }]

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "الرجاء تحديد المنتجات والوحدات للبيع" });
    }

    const saleItems = [];

    for (const { productId, unitIds } of items) {
      if (!unitIds || unitIds.length === 0) continue;

      const units = await ProductUnit.find({
        _id: { $in: unitIds },
        product: productId,
      });

      if (units.length !== unitIds.length) {
        return res.status(400).json({
          message: `بعض الوحدات المحددة غير موجودة للمنتج: ${productId}`,
        });
      }

      // Delete the sold units
      await ProductUnit.deleteMany({ _id: { $in: unitIds } });

      const product = await Product.findById(productId);
      const unitPrice = product.price;
      const totalPrice = unitPrice * unitIds.length;

      saleItems.push({
        product: productId,
        quantity: unitIds.length,
        unitPrice,
        totalPrice,
      });
    }

    const sale = await salesModel.create({ items: saleItems });

    res.status(200).json({
      message: "تم تنفيذ عملية البيع بنجاح",
      sale,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تنفيذ البيع", error });
  }
};

export const getSalesHistory = async (req, res) => {
  try {
    // i want to show the last operations of sales is shown first
    const sales = await salesModel
      .find()
      .sort({ createdAt: -1 })
      .populate("items.product");
    // const sales = await salesModel.find().populate("items.product");
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales history:", error);
    res.status(500).json({ message: "فشل في جلب تاريخ المبيعات", error });
  }
};
