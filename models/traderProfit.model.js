import mongoose from "mongoose";

// سكيما لتتبع الأرباح من التجار
const traderProfitSchema = new mongoose.Schema(
  {
    traderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true,
    },
    traderName: String, // لسهولة العرض

    // المعاملة المالية
    transactionType: {
      type: String,
      enum: ["order", "payment"], // طلب جديد أو دفعة
      required: true,
    },

    // بيانات الطلب (إذا كان نوع المعاملة طلب)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TraderOrder",
    },

    // المبلغ المدفوع في هذه المعاملة
    paidAmount: { type: Number, required: true },

    // الرصيد التراكمي للتاجر بعد هذه المعاملة
    traderCumulativeBalance: { type: Number, required: true },

    // إجمالي الربح التراكمي من جميع التجار بعد هذه المعاملة
    totalCumulativeProfit: { type: Number, required: true },

    description: String, // وصف المعاملة
  },
  { timestamps: true }
);

// فهرس لتحسين الأداء
traderProfitSchema.index({ createdAt: -1 });
traderProfitSchema.index({ traderId: 1, createdAt: -1 });

const TraderProfit = mongoose.model("TraderProfit", traderProfitSchema);
export default TraderProfit;
