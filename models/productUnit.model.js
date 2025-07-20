// models/productUnit.model.js
import mongoose from "mongoose";

const productUnitSchema = new mongoose.Schema(
  {
    serial_number: { type: String, required: true, unique: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    date_produced: { type: Date, default: Date.now },
    batch_no: { type: String },
    status: { type: String, enum: ["جاهز", "تم شحنه"], default: "جاهز" },
  },
  { timestamps: true }
);

export default mongoose.model("ProductUnit", productUnitSchema);
