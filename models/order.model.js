import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      minlength: 3,
    },
    phone: {
      type: String,
      required: true,
      set: function (v) {
        // remove all spaces
        return v.replace(/\s+/g, "");
      },
      validate: {
        validator: function (v) {
          // allow optional +20 or 0, then 10/11/12/15, then 8 digits
          return /^(\+20|0)?(10|11|12|15)[0-9]{8}$/.test(v);
        },
        message: (props) => `${props.value} رقم موبايل غير صالح.`,
      },
    },
    address: {
      type: String,
      required: true,
      minlength: 5,
    },
    governorate: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "لا يوجد",
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    products: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        price: Number,
        quantity: Number,
        code: String,
        discount: { type: Number, default: 0 },
      },
    ],
    status: {
      type: String,
      enum: ["معلق", "تم الشحن", "مؤكد", "ملغي", "راجع"],
      default: "معلق",
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
