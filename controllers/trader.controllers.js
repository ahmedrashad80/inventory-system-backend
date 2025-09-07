import mongoose from "mongoose";
import Trader from "../models/trader.model.js";
import TraderOrder from "../models/traderOrder.model.js";
import TraderProfit from "../models/traderProfit.model.js";
import TraderPayment from "../models/traderPayment.model.js";
import productModel from "../models/product.model.js";
import productUnitModel from "../models/productUnit.model.js";
// إنشاء تاجر جديد
export const createTrader = async (req, res) => {
  try {
    const { name, phone, address, notes } = req.body;

    // اجعل الاسم فريدا
    const existingTrader = await Trader.findOne({ name });
    if (existingTrader) {
      return res.status(400).json({ message: "اسم التاجر موجود بالفعل." });
    }

    // التحقق من البيانات
    if (!name || name.length < 3) {
      return res
        .status(400)
        .json({ message: "اسم التاجر يجب أن يكون 3 حروف أو أكثر." });
    }

    let sanitizedPhone = phone.replace(/\s+/g, "");
    if (sanitizedPhone.startsWith("+20")) {
      sanitizedPhone = sanitizedPhone.replace("+20", "0");
    }

    if (!/^(010|011|012|015)[0-9]{8}$/.test(sanitizedPhone)) {
      return res.status(400).json({ message: "رقم الهاتف غير صالح." });
    }

    // إنشاء التاجر
    const trader = await Trader.create({
      name,
      phone: sanitizedPhone,
      address,
      notes: notes || "لا يوجد",
    });

    res.status(201).json({
      message: "تم إنشاء التاجر بنجاح.",
      trader,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "رقم الهاتف مستخدم من قبل." });
    }
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إنشاء التاجر.", error: error.message });
  }
};

// جلب جميع التجار
export const getAllTraders = async (req, res) => {
  try {
    const traders = await Trader.find().sort({ createdAt: -1 });

    if (traders.length === 0) {
      return res.status(200).json({ message: "لا يوجد تجار مسجلون." });
    }

    // حساب المبلغ المتبقي لكل تاجر
    const tradersWithRemaining = traders.map((trader) => ({
      ...trader.toObject(),
      remainingAmount: trader.totalBalance - trader.totalPaid,
    }));

    res.status(200).json({
      message: "تم جلب التجار بنجاح.",
      traders: tradersWithRemaining,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب التجار", error: error.message });
  }
};

// جلب تاجر بالـ ID مع إحصائياته
export const getTraderById = async (req, res) => {
  try {
    const { id } = req.params;

    const trader = await Trader.findById(id);
    if (!trader) {
      return res.status(404).json({ message: "التاجر غير موجود." });
    }

    // جلب طلبات التاجر
    const orders = await TraderOrder.find({ traderId: id })
      .populate("products.productId", "name code")
      .sort({ createdAt: -1 });

    // جلب دفعات التاجر
    const payments = await TraderPayment.find({ traderId: id }).sort({
      createdAt: -1,
    });

    const remainingAmount = trader.totalBalance - trader.totalPaid;

    res.status(200).json({
      message: "تم جلب بيانات التاجر بنجاح.",
      trader: {
        ...trader.toObject(),
        remainingAmount,
      },
      orders,
      payments,
      stats: {
        totalOrders: trader.totalOrders,
        totalBalance: trader.totalBalance,
        totalPaid: trader.totalPaid,
        remainingAmount,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب بيانات التاجر", error: error.message });
  }
};
export const getTraderOrders = async (req, res) => {
  try {
    const { id } = req.params;

    const orders = await TraderOrder.find({ traderId: id })
      .populate("traderId", "name phone address ")
      .populate("products.productId", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "تم جلب طلبات التاجر بنجاح.",
      orders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب طلبات التاجر", error: error.message });
  }
};
export const getTraderPayments = async (req, res) => {
  try {
    const { id } = req.params;

    const payments = await TraderPayment.find({ traderId: id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "تم جلب دفعات التاجر بنجاح.",
      payments,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب دفعات التاجر", error: error.message });
  }
};

// إنشاء طلب جديد للتاجر
export const createTraderOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { traderId, products, paidAmount = 0, notes = "لا يوجد" } = req.body;

    // التحقق من وجود التاجر
    const trader = await Trader.findById(traderId).session(session);
    if (!trader) {
      return res.status(404).json({ message: "التاجر غير موجود." });
    }

    // التحقق من المنتجات
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "يجب إضافة منتجات للطلب." });
    }

    // التحقق من توفر المنتجات في المخزون وحساب القيمة
    let totalAmount = 0;
    const processedProducts = [];

    for (const product of products) {
      if (!product.quantity || product.quantity <= 0) {
        throw new Error("الكمية يجب أن تكون أكبر من صفر.");
      }
      if (!product.wholesalePrice || product.wholesalePrice <= 0) {
        throw new Error("سعر الجملة يجب أن يكون أكبر من صفر.");
      }

      // التحقق من وجود المنتج
      const productDoc = await productModel
        .findById(product.productId)
        .session(session);
      if (!productDoc) {
        throw new Error(
          `المنتج ${product.name || product.productId} غير موجود.`
        );
      }

      // التحقق من توفر الوحدات المطلوبة في المخزون
      const availableUnits = await productUnitModel
        .find({
          product: product.productId,
          status: "جاهز",
        })
        .sort({ createdAt: 1 }) // FIFO
        .limit(product.quantity)
        .session(session);

      if (availableUnits.length < product.quantity) {
        throw new Error(
          `المنتج ${product.name || productDoc.name} غير متوفر بالكمية المطلوبة.
           متوفر: ${availableUnits.length}، مطلوب: ${product.quantity}`
        );
      }

      const totalPrice = product.quantity * product.wholesalePrice;
      totalAmount += totalPrice;

      processedProducts.push({
        productId: product.productId,
        name: product.name || productDoc.name,
        code: product.code || productDoc.code,
        quantity: product.quantity,
        wholesalePrice: product.wholesalePrice,
        totalPrice,
      });

      // حذف الوحدات المستخدمة من المخزون
      const unitIds = availableUnits.map((unit) => unit._id);
      await productUnitModel.deleteMany({ _id: { $in: unitIds } }, { session });
    }

    if (paidAmount > totalAmount) {
      return res.status(400).json({
        message: "المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي الطلب.",
      });
    }

    const remainingAmount = totalAmount - paidAmount;

    // إنشاء رقم الطلب
    const orderCount = await TraderOrder.countDocuments().session(session);
    const orderNumber = `TR-${String(orderCount + 1).padStart(6, "0")}`;

    // إنشاء الطلب
    const traderOrder = new TraderOrder({
      traderId,
      orderNumber,
      products: processedProducts,
      totalAmount,
      paidAmount,
      remainingAmount,
      notes,
    });

    await traderOrder.save({ session });

    // تحديث بيانات التاجر
    trader.totalOrders += 1;
    trader.totalBalance += totalAmount;
    trader.totalPaid += paidAmount;
    trader.lastOrderDate = new Date();
    await trader.save({ session });

    // تسجيل الربح إذا تم الدفع
    if (paidAmount > 0) {
      await recordProfit(
        {
          traderId,
          traderName: trader.name,
          transactionType: "order",
          orderId: traderOrder._id,
          paidAmount,
          description: `طلب جديد رقم ${orderNumber}`,
        },
        session
      );
    }

    await session.commitTransaction();

    res.status(201).json({
      message: "تم إنشاء الطلب بنجاح.",
      order: traderOrder,
    });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إنشاء الطلب.", error: error.message });
  } finally {
    session.endSession();
  }
};

// تسجيل دفعة جديدة
export const recordPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      traderId,
      amount,
      paymentMethod = "نقدي",
      notes = "لا يوجد",
    } = req.body;

    // التحقق من البيانات
    if (!amount || amount <= 0) {
      return res
        .status(400)
        .json({ message: "مبلغ الدفعة يجب أن يكون أكبر من صفر." });
    }

    const trader = await Trader.findById(traderId).session(session);
    if (!trader) {
      return res.status(404).json({ message: "التاجر غير موجود." });
    }

    // التحقق من أن المبلغ لا يتجاوز المتبقي
    const remainingAmount = trader.totalBalance - trader.totalPaid;
    if (amount > remainingAmount) {
      return res.status(400).json({
        message: `المبلغ المدفوع (${amount}) أكبر من المبلغ المتبقي (${remainingAmount}).`,
      });
    }

    // إنشاء سجل الدفعة
    const payment = new TraderPayment({
      traderId,
      amount,
      paymentMethod,
      notes,
    });

    await payment.save({ session });

    // تحديث بيانات التاجر
    trader.totalPaid += amount;
    await trader.save({ session });

    // تسجيل الربح
    await recordProfit(
      {
        traderId,
        traderName: trader.name,
        transactionType: "payment",
        paidAmount: amount,
        description: `دفعة جديدة بقيمة ${amount} جنيه`,
      },
      session
    );

    await session.commitTransaction();

    res.status(201).json({
      message: "تم تسجيل الدفعة بنجاح.",
      payment,
    });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء تسجيل الدفعة.", error: error.message });
  } finally {
    session.endSession();
  }
};

// الحصول على إجمالي الأرباح
export const getTotalProfit = async (req, res) => {
  try {
    const lastRecord = await TraderProfit.findOne(
      {},
      { totalCumulativeProfit: 1 }
    ).sort({ createdAt: -1 });
    // i want to get all profits records but with newest first to oldest
    // and populate order namber if transactionType is order

    const allProfits = await TraderProfit.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "orderId",
        select: "orderNumber",
      });

    const totalProfit = lastRecord ? lastRecord.totalCumulativeProfit : 0;

    res.status(200).json({
      message: "تم جلب إجمالي الأرباح بنجاح.",
      allProfits,
      totalProfit,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب إجمالي الأرباح", error: error.message });
  }
};

export const getProfitHistory = async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const allProfits = await TraderProfit.find(filter).sort({ createdAt: 1 });
    res.json({ allProfits });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch profit history",
      error: error.message,
    });
  }
};
// تعديل بيانات التاجر
export const updateTrader = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, notes } = req.body;

    const trader = await Trader.findById(id);
    if (!trader) {
      return res.status(404).json({ message: "التاجر غير موجود." });
    }

    // التحقق من رقم الهاتف إذا تم تعديله
    if (phone && phone !== trader.phone) {
      let sanitizedPhone = phone.replace(/\s+/g, "");
      if (sanitizedPhone.startsWith("+20")) {
        sanitizedPhone = sanitizedPhone.replace("+20", "0");
      }
      if (!/^(010|011|012|015)[0-9]{8}$/.test(sanitizedPhone)) {
        return res.status(400).json({ message: "رقم الهاتف غير صالح." });
      }
      trader.phone = sanitizedPhone;
    }

    // تحديث البيانات الأساسية فقط (لا نعدل الحسابات المالية من هنا)
    if (name) trader.name = name;
    if (address) trader.address = address;
    if (notes !== undefined) trader.notes = notes;
    // if (status) trader.status = status;

    await trader.save();

    res.status(200).json({
      message: "تم تحديث بيانات التاجر بنجاح.",
      trader,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "رقم الهاتف مستخدم من قبل." });
    }
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء تحديث التاجر.", error: error.message });
  }
};

// تعديل طلب التاجر
export const updateTraderOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { products, paidAmount, notes } = req.body;

    const order = await TraderOrder.findById(id).session(session);
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود." });
    }

    const trader = await Trader.findById(order.traderId).session(session);

    // حفظ القيم القديمة لحساب الفرق
    const oldTotalAmount = order.totalAmount;
    const oldPaidAmount = order.paidAmount;
    const oldProducts = [...order.products];

    // تحديث المنتجات إذا تم إرسالها
    if (products && products.length > 0) {
      // إنشاء خريطة للمنتجات القديمة والجديدة للمقارنة
      const oldProductsMap = new Map();
      oldProducts.forEach((p) => {
        oldProductsMap.set(p.productId.toString(), p.quantity);
      });

      const newProductsMap = new Map();
      products.forEach((p) => {
        newProductsMap.set(p.productId.toString(), p.quantity);
      });

      // معالجة كل منتج للتحقق من التغييرات
      for (const [productId, oldQuantity] of oldProductsMap) {
        const newQuantity = newProductsMap.get(productId) || 0;
        const quantityDiff = newQuantity - oldQuantity;

        if (quantityDiff < 0) {
          // إرجاع وحدات للمخزون
          const unitsToReturn = Math.abs(quantityDiff);
          const newBatchNumber = `BATCH-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;

          const units = [];
          for (let i = 0; i < unitsToReturn; i++) {
            units.push({
              product: productId,
              status: "جاهز",
              serial_number: `${newBatchNumber}-${i
                .toString()
                .padStart(3, "0")}`,
              batch_no: newBatchNumber,
            });
          }
          await productUnitModel.insertMany(units, { session });
        } else if (quantityDiff > 0) {
          // خصم وحدات إضافية من المخزون
          const availableUnits = await productUnitModel
            .find({
              product: productId,
              status: "جاهز",
            })
            .sort({ createdAt: 1 })
            .limit(quantityDiff)
            .session(session);

          if (availableUnits.length < quantityDiff) {
            const productDoc = await productModel
              .findById(productId)
              .session(session);
            throw new Error(
              `المنتج ${
                productDoc?.name || productId
              } غير متوفر بالكمية الإضافية المطلوبة.
               متوفر: ${availableUnits.length}، مطلوب: ${quantityDiff}`
            );
          }

          const unitIds = availableUnits.map((unit) => unit._id);
          await productUnitModel.deleteMany(
            { _id: { $in: unitIds } },
            { session }
          );
        }
      }

      // معالجة المنتجات الجديدة المضافة
      for (const [productId, newQuantity] of newProductsMap) {
        if (!oldProductsMap.has(productId)) {
          // منتج جديد - نحتاج لخصم وحداته
          const availableUnits = await productUnitModel
            .find({
              product: productId,
              status: "جاهز",
            })
            .sort({ createdAt: 1 })
            .limit(newQuantity)
            .session(session);

          if (availableUnits.length < newQuantity) {
            const productDoc = await productModel
              .findById(productId)
              .session(session);
            throw new Error(
              `المنتج الجديد ${
                productDoc?.name || productId
              } غير متوفر بالكمية المطلوبة.
               متوفر: ${availableUnits.length}، مطلوب: ${newQuantity}`
            );
          }

          const unitIds = availableUnits.map((unit) => unit._id);
          await productUnitModel.deleteMany(
            { _id: { $in: unitIds } },
            { session }
          );
        }
      }

      // معالجة المنتجات المحذوفة
      for (const [productId, oldQuantity] of oldProductsMap) {
        if (!newProductsMap.has(productId)) {
          // منتج محذوف - إرجاع كل وحداته
          const newBatchNumber = `BATCH-${Date.now()}-${Math.floor(
            Math.random() * 1000
          )}`;

          const units = [];
          for (let i = 0; i < oldQuantity; i++) {
            units.push({
              product: productId,
              status: "جاهز",
              serial_number: `${newBatchNumber}-${i
                .toString()
                .padStart(3, "0")}`,
              batch_no: newBatchNumber,
            });
          }
          await productUnitModel.insertMany(units, { session });
        }
      }

      // تحديث بيانات المنتجات في الطلب
      let newTotalAmount = 0;
      const processedProducts = [];

      for (const product of products) {
        if (!product.quantity || product.quantity <= 0) {
          throw new Error("الكمية يجب أن تكون أكبر من صفر.");
        }
        if (!product.wholesalePrice || product.wholesalePrice <= 0) {
          throw new Error("سعر الجملة يجب أن يكون أكبر من صفر.");
        }

        const totalPrice = product.quantity * product.wholesalePrice;
        newTotalAmount += totalPrice;

        processedProducts.push({
          productId: product.productId,
          name: product.name,
          code: product.code,
          quantity: product.quantity,
          wholesalePrice: product.wholesalePrice,
          totalPrice,
        });
      }

      order.products = processedProducts;
      order.totalAmount = newTotalAmount;
    }

    // تحديث المبلغ المدفوع إذا تم إرساله
    if (paidAmount !== undefined) {
      if (paidAmount > order.totalAmount) {
        return res.status(400).json({
          message: "المبلغ المدفوع لا يمكن أن يكون أكبر من إجمالي الطلب.",
        });
      }
      order.paidAmount = paidAmount;
    }

    order.remainingAmount = order.totalAmount - order.paidAmount;
    if (notes !== undefined) order.notes = notes;

    await order.save({ session });

    // تحديث بيانات التاجر حسب الفرق
    const totalAmountDiff = order.totalAmount - oldTotalAmount;
    const paidAmountDiff = order.paidAmount - oldPaidAmount;

    trader.totalBalance += totalAmountDiff;
    trader.totalPaid += paidAmountDiff;
    await trader.save({ session });

    // تسجيل الربح إذا كان هناك فرق في المبلغ المدفوع
    if (paidAmountDiff !== 0) {
      const description =
        paidAmountDiff > 0
          ? `زيادة دفعة في الطلب ${order.orderNumber} بقيمة ${paidAmountDiff}`
          : `تقليل دفعة في الطلب ${order.orderNumber} بقيمة ${Math.abs(
              paidAmountDiff
            )}`;

      await recordProfit(
        {
          traderId: trader._id,
          traderName: trader.name,
          transactionType: "order",
          orderId: order._id,
          paidAmount: paidAmountDiff,
          description,
        },
        session
      );
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "تم تحديث الطلب بنجاح.",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء تحديث الطلب.", error: error.message });
  } finally {
    session.endSession();
  }
};

// حذف طلب التاجر
export const deleteTraderOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const order = await TraderOrder.findById(id).session(session);
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود." });
    }

    const trader = await Trader.findById(order.traderId).session(session);

    // إرجاع جميع وحدات المنتجات إلى المخزون
    for (const product of order.products) {
      const newBatchNumber = `BATCH-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )}`;

      const units = [];
      for (let i = 0; i < product.quantity; i++) {
        units.push({
          product: product.productId,
          status: "جاهز",
          serial_number: `${newBatchNumber}-${i.toString().padStart(3, "0")}`,
          batch_no: newBatchNumber,
        });
      }

      await productUnitModel.insertMany(units, { session });
    }

    // إرجاع القيم من حساب التاجر
    trader.totalOrders -= 1;
    trader.totalBalance -= order.totalAmount;
    trader.totalPaid -= order.paidAmount;
    await trader.save({ session });

    // تسجيل عكس الربح (سالب) إذا كان هناك مبلغ مدفوع في الطلب
    if (order.paidAmount > 0) {
      await recordProfit(
        {
          traderId: trader._id,
          traderName: trader.name,
          transactionType: "order",
          orderId: order._id,
          paidAmount: -order.paidAmount, // سالب لإرجاع الربح
          description: `حذف الطلب ${order.orderNumber}`,
        },
        session
      );
    }

    // حذف الطلب
    await TraderOrder.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    res.status(200).json({
      message: "تم حذف الطلب بنجاح.",
    });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء حذف الطلب.", error: error.message });
  } finally {
    session.endSession();
  }
};

// تعديل دفعة
export const updatePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;

    const payment = await TraderPayment.findById(id).session(session);
    if (!payment) {
      return res.status(404).json({ message: "الدفعة غير موجودة." });
    }

    const trader = await Trader.findById(payment.traderId).session(session);
    const oldAmount = payment.amount;

    // التحقق من المبلغ الجديد
    if (amount !== undefined) {
      if (amount <= 0) {
        return res
          .status(400)
          .json({ message: "مبلغ الدفعة يجب أن يكون أكبر من صفر." });
      }

      // التحقق من أن المبلغ الجديد لا يتجاوز المتبقي
      const currentRemaining = trader.totalBalance - trader.totalPaid;
      const newRemaining = currentRemaining + oldAmount - amount;

      if (newRemaining < 0) {
        return res.status(400).json({
          message: "المبلغ الجديد يتجاوز إجمالي المستحق على التاجر.",
        });
      }

      payment.amount = amount;
    }

    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (notes !== undefined) payment.notes = notes;

    await payment.save({ session });

    // تحديث بيانات التاجر إذا تغير المبلغ
    if (amount !== undefined && amount !== oldAmount) {
      const amountDiff = amount - oldAmount;
      trader.totalPaid += amountDiff;
      await trader.save({ session });

      // تسجيل الربح للفرق
      const description =
        amountDiff > 0
          ? `تعديل دفعة بزيادة ${amountDiff} جنيه`
          : `تعديل دفعة بتقليل ${Math.abs(amountDiff)} جنيه`;

      await recordProfit(
        {
          traderId: trader._id,
          traderName: trader.name,
          transactionType: "payment",
          paidAmount: amountDiff,
          description,
        },
        session
      );
    }

    await session.commitTransaction();

    res.status(200).json({
      message: "تم تعديل الدفعة بنجاح.",
      payment,
    });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء تعديل الدفعة.", error: error.message });
  } finally {
    session.endSession();
  }
};

// حذف دفعة
export const deletePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const payment = await TraderPayment.findById(id).session(session);
    if (!payment) {
      return res.status(404).json({ message: "الدفعة غير موجودة." });
    }

    const trader = await Trader.findById(payment.traderId).session(session);

    // إرجاع المبلغ من حساب التاجر
    trader.totalPaid -= payment.amount;
    await trader.save({ session });

    // تسجيل عكس الربح (سالب)
    await recordProfit(
      {
        traderId: trader._id,
        traderName: trader.name,
        transactionType: "payment",
        paidAmount: -payment.amount, // سالب لإرجاع الربح
        description: `حذف دفعة بقيمة ${payment.amount} جنيه`,
      },
      session
    );

    // حذف الدفعة
    await TraderPayment.findByIdAndDelete(id, { session });

    await session.commitTransaction();

    res.status(200).json({
      message: "تم حذف الدفعة بنجاح.",
    });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء حذف الدفعة.", error: error.message });
  } finally {
    session.endSession();
  }
};

// دالة مساعدة لتسجيل الربح
async function recordProfit(profitData, session) {
  const {
    traderId,
    traderName,
    transactionType,
    orderId,
    paidAmount,
    description,
  } = profitData;

  // الحصول على بيانات التاجر المحدثة
  const trader = await Trader.findById(traderId).session(session);
  const traderCumulativeBalance = trader.totalPaid;

  // الحصول على آخر إجمالي ربح مسجل
  const lastProfitRecord = await TraderProfit.findOne(
    {},
    { totalCumulativeProfit: 1 }
  )
    .sort({ createdAt: -1 })
    .session(session);

  const lastTotalProfit = lastProfitRecord
    ? lastProfitRecord.totalCumulativeProfit
    : 0;
  const newTotalProfit = lastTotalProfit + paidAmount;

  // إنشاء سجل الربح
  const profitRecord = new TraderProfit({
    traderId,
    traderName,
    transactionType,
    orderId,
    paidAmount,
    traderCumulativeBalance,
    totalCumulativeProfit: newTotalProfit,
    description,
  });

  await profitRecord.save({ session });
  return profitRecord;
}
