import mongoose from "mongoose";
import Component from "../models/component.model.js";
import componentMovementModel from "../models/componentMovement.model.js";
import Order from "../models/order.model.js";
import productModel from "../models/product.model.js";
import productUnitModel from "../models/productUnit.model.js";
import Shipping from "../models/shipping.model.js";

export const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, governorate, notes, products } =
      req.body;

    if (!governorate) {
      return res.status(400).json({ message: "المحافظة مطلوبة." });
    }
    const shipping = await Shipping.findOne();
    if (!shipping) {
      return res.status(404).json({ message: "لا توجد بيانات شحن." });
    }
    const gov = shipping.governorates.find((g) => g.name === governorate);
    if (!gov) {
      return res.status(404).json({ message: "المحافظة غير موجودة." });
    }
    if (!customerName || customerName.length < 3) {
      return res
        .status(400)
        .json({ message: "اسم العميل يجب أن يكون 3 حروف أو أكثر." });
    }

    let sanitizedPhone = phone.replace(/\s+/g, ""); // remove all spaces
    if (sanitizedPhone.startsWith("+20")) {
      sanitizedPhone = sanitizedPhone.replace("+20", "0");
    }

    if (!/^(010|011|012|015)[0-9]{8}$/.test(sanitizedPhone)) {
      return res.status(400).json({ message: "رقم الهاتف غير صالح." });
    }

    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const lastOrder = await Order.findOne().sort({ invoiceNumber: -1 });
    let nextNum = 1;
    if (lastOrder && lastOrder.invoiceNumber && lastOrder.invoiceNumber.includes(today)) {
      const parts = lastOrder.invoiceNumber.split("-");
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const invoiceNumber = `INV-${today}-${nextNum.toString().padStart(4, "0")}`;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "يجب إضافة منتجات للطلب." });
    }
    const customerOrder = products.map((product) => {
      const price = Number(product.price || product.selling_price || 0);
      const discount = Number(product.discount || 0);
      const quantity = Number(product.quantity || 1);
      
      return {
        productId: product._id,
        code: product.code,
        name: product.name,
        price: price,
        quantity: quantity,
        discount: discount,
      };
    });

    const totalPrice = customerOrder.reduce(
      (total, item) =>
        total + ((item.price * (100 - item.discount)) / 100) * item.quantity,
      0
    );

    if (isNaN(totalPrice)) {
       throw new Error("فشل في حساب إجمالي الطلب - بيانات المنتجات غير صحيحة");
    }

    const order = await Order.create({
      customerName,
      phone: sanitizedPhone,
      address,
      governorate,
      notes,
      products: customerOrder,
      invoiceNumber,
      shippingCost: Number(gov.shippingCost || 0),
      totalPrice: totalPrice + Number(gov.shippingCost || 0),
    });

    res.status(200).json({
      message: "تم إنشاء الطلب بنجاح.",
      order,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إنشاء الطلب.", error: err.message });
  }
};

// get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    if (orders.length === 0) {
      return res.status(200).json({ message: "لا توجد طلبات." });
    }
    res.status(200).json({
      message: "تم جلب الطلبات بنجاح.",
      orders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في جلب الطلبات", error: error.message });
  }
};

// get order by id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود." });
    }
    res.status(200).json({
      message: "تم جلب الطلب بنجاح.",
      order,
    });
  } catch (error) {
    res.status(500).json({ message: "فشل في جلب الطلب", error: error.message });
  }
};

// update order

export const updateOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const {
      customerName,
      phone,
      address,
      governorate,
      notes,
      products,
      status,
    } = req.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود." });
    }

    // نطبّق trim مرة واحدة ونستخدمها في المقارنات والتحديث
    const nextStatus = typeof status === "string" ? status.trim() : undefined;

    // تحديث بيانات العميل
    if (customerName) order.customerName = customerName;

    if (phone) {
      let sanitizedPhone = phone.replace(/\s+/g, "");
      if (sanitizedPhone.startsWith("+20")) {
        sanitizedPhone = sanitizedPhone.replace("+20", "0");
      }
      if (!/^(010|011|012|015)[0-9]{8}$/.test(sanitizedPhone)) {
        return res.status(400).json({ message: "رقم الهاتف غير صالح." });
      }
      order.phone = sanitizedPhone;
    }

    if (address) order.address = address;
    if (governorate) order.governorate = governorate;
    if (notes) order.notes = notes;
    if (products) order.products = products; // لو بتعدّل المنتجات مع الحالة، الخصم هيتم على اللستة المحدثة

    // ========== التعامل مع المخزون ==========
    if (nextStatus && nextStatus !== order.status) {
      // 1) لو الحالة أصبحت "تم الشحن" ولم تكن كذلك قبلها → خصم
      if (nextStatus === "تم الشحن" && order.status !== "تم الشحن") {
        for (const item of order.products) {
          const product = await productModel
            .findById(item.productId)
            .session(session);

          if (product) {
            // منتج رئيسي → خصم وحدات (FIFO)
            const units = await productUnitModel
              .find({ product: item.productId })
              .sort({ createdAt: 1 })
              .limit(item.quantity)
              .session(session);

            if (units.length < item.quantity) {
              throw new Error(`المنتج ${product.name} غير كافي في المخزن`);
            }

            const unitIds = units.map((u) => u._id);
            await productUnitModel.deleteMany(
              { _id: { $in: unitIds } },
              { session }
            );
          } else {
            // قطعة غيار → خصم مباشر + حركة مخزون
            const component = await Component.findById(item.productId).session(
              session
            );
            if (!component) throw new Error(`المكون ${item.name} غير موجود`);
            if (component.quantity < item.quantity) {
              throw new Error(`الكمية غير متوفرة للمكون ${item.name}`);
            }

            await Component.findByIdAndUpdate(
              item.productId,
              { $inc: { quantity: -item.quantity } },
              { session }
            );

            await componentMovementModel.create(
              [
                {
                  component: item.productId,
                  type: "out",
                  quantity: item.quantity,
                  reason: "بيع من المتجر",
                },
              ],
              { session }
            );
          }
        }
      }

      // 2) لو الحالة تغيّرت "من تم الشحن" إلى أي شيء آخر → إرجاع المخزون
      if (order.status === "تم الشحن" && nextStatus !== "تم الشحن") {
        for (const item of order.products) {
          const product = await productModel
            .findById(item.productId)
            .session(session);

          if (product) {
            const newBatchNumber = `BATCH-${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}`;
            // إرجاع وحدات المنتج (ملاحظة: لو عندك serial/batch مطلوبين في الـ schema لازم تتخزن وقت الشحن وترجع بنفسها)
            const units = [];
            for (let i = 0; i < item.quantity; i++) {
              units.push({
                product: item.productId,
                status: "جاهز",
                serial_number: `${newBatchNumber}-${i
                  .toString()
                  .padStart(3, "0")}`,
                batch_number: newBatchNumber,
              });
            }
            await productUnitModel.insertMany(units, { session });
          } else {
            // إرجاع كمية قطع الغيار + حركة مخزون
            await Component.findByIdAndUpdate(
              item.productId,
              { $inc: { quantity: item.quantity } },
              { session }
            );

            await componentMovementModel.create(
              [
                {
                  component: item.productId,
                  type: "in",
                  quantity: item.quantity,
                  reason: "مرتجع من عميل",
                },
              ],
              { session }
            );
          }
        }
      }
    }

    // تحديث الحالة (لو جاية)
    if (nextStatus) order.status = nextStatus;

    await order.save({ session });
    await session.commitTransaction();

    res.status(200).json({ message: "تم تحديث الطلب بنجاح.", order });
  } catch (error) {
    await session.abortTransaction();
    res
      .status(500)
      .json({ message: "فشل في تحديث الطلب", error: error.message });
  } finally {
    session.endSession();
  }
};
// delete order
export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود." });
    }
    res.status(200).json({ message: "تم حذف الطلب بنجاح." });
  } catch (error) {
    res.status(500).json({ message: "فشل في حذف الطلب", error: error.message });
  }
};
