import mongoose from "mongoose";

const componentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    unit_price: {
      type: Number,
      default: 0,
    },

    selling_price: {
      type: Number,
      default: function () {
        return this.unit_price + 20;
      },
      // default: 0,
    },
    supplier: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Component = mongoose.model("Component", componentSchema);

export default Component;
