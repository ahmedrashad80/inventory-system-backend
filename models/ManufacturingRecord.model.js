import mongoose from "mongoose";

const manufacturingRecordSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    product_code: { type: String }, // Add product_code field
    batch_no: { type: String }, // Add batch_no field
    quantity_produced: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    created_by: String,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.model("ManufacturingRecord", manufacturingRecordSchema);
