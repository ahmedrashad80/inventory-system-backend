import mongoose from "mongoose";

const governorateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  shippingCost: {
    type: Number,
    required: true,
    default: 0,
  },
});

const shippingSchema = new mongoose.Schema({
  governorates: [governorateSchema], // مصفوفة من المحافظات مع تكلفة التوصيل
});

export default mongoose.model("Shipping", shippingSchema);
