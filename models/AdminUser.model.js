import mongoose from "mongoose";

const AdminUserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

export default mongoose.model("AdminUser", AdminUserSchema);
