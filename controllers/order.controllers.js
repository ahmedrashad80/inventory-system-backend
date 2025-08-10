import Order from "../models/order.model.js";

export const createOrder = async (req, res) => {
  try {
    const { customerName, phone, address, governorate, notes, products } =
      req.body;

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

    const count = await Order.countDocuments();
    const invoiceNumber = `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${(count + 1).toString().padStart(4, "0")}`;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "يجب إضافة منتجات للطلب." });
    }
    const customerOrder = products.map((product) => ({
      code: product.code,
      name: product.name,
      price: product.price,
      quantity: product.quantity,
    }));

    const totalPrice = customerOrder.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      customerName,
      phone: sanitizedPhone,
      address,
      governorate,
      notes,
      products: customerOrder,
      invoiceNumber,
      totalPrice,
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
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود." });
    }
    if (customerName) order.customerName = customerName;

    if (phone) {
      // make validation for phone
      let sanitizedPhone = phone.replace(/\s+/g, ""); // remove all spaces
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
    if (products) order.products = products;
    if (status) order.status = status.trim(); // أضف هذا السطر
    await order.save();
    res.status(200).json({ message: "تم تحديث الطلب بنجاح.", order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "فشل في تحديث الطلب", error: error.message });
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
