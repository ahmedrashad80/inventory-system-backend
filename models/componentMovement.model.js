// models/componentMovement.model.js
import mongoose from "mongoose";

const componentMovementSchema = new mongoose.Schema(
  {
    component: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Component",
      required: true,
    },
    type: { type: String, enum: ["in", "out", "update"], required: true },
    quantity: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    reason: { type: String },
    related_product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    notes: { type: String }, // تمت الإضافة هنا
  },
  { timestamps: true }
);

export default mongoose.model("ComponentMovement", componentMovementSchema);
