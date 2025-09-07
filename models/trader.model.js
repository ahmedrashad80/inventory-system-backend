import mongoose from "mongoose";
const traderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 3, unique: true },
    phone: {
      type: String,
      required: true,
    },
    address: { type: String, required: true },
    notes: { type: String, default: "لا يوجد" },

    totalBalance: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Trader = mongoose.model("Trader", traderSchema);
export default Trader;
