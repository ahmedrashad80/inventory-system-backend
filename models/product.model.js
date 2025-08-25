import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,

    image: [{ type: String }],
    price: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    components: [
      {
        component: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Component",
          required: true,
        },
        quantity_required: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
