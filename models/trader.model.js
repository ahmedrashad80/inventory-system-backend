import mongoose from "mongoose";
const traderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3 },
    phone: {
      type: String,
      required: true,
    },
    address: { type: String, required: true },
    businessType: { type: String },
    discountPercentage: { type: Number, default: 0 }, // خصم عام
    customPrices: [
      {
        // أسعار مخصصة لمنتجات معينة
        productId: mongoose.Schema.Types.ObjectId,
        price: Number,
      },
    ],

    // الحسابات المالية
    totalDebt: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

const Trader = mongoose.model("Trader", traderSchema);
export default Trader;
