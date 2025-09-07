import mongoose from "mongoose";

const traderOrderSchema = new mongoose.Schema(
  {
    traderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        code: String,
        quantity: { type: Number, required: true },
        wholesalePrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    notes: { type: String, default: "لا يوجد" },
  },
  { timestamps: true }
);

const TraderOrder = mongoose.model("TraderOrder", traderOrderSchema);
export default TraderOrder;
