import mongoose from "mongoose";

const traderPaymentSchema = new mongoose.Schema(
  {
    traderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true,
    },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["نقدي", "تحويل", "شيك", "أخري"],
      default: "نقدي",
    },
    notes: { type: String, default: "لا يوجد" },
  },
  { timestamps: true }
);

const TraderPayment = mongoose.model("TraderPayment", traderPaymentSchema);
export default TraderPayment;
