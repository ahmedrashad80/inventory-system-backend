import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema({
  username: String,
  password: String,
  type: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin",
  },
});

export default mongoose.model("AdminUser", AdminUserSchema);
