import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // i think we need add prrice now
    // and add it to the productUnit model
    // and add it to the manufacturingRecord model

    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    image: String,

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
