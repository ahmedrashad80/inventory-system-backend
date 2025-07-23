import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import componentRoutes from "./routes/component.routes.js";
import productRoutes from "./routes/product.routes.js";
import loginRoutes from "./routes/login.routes.js";
// import protect from "./middlewares/auth.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  })
);
app.use(express.json());

app.use(cookieParser());

app.use("/api/user", loginRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/products", productRoutes);
app.use("/uploads", express.static("uploads"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(" successfully connected to the database");
    console.log("-----------------------------------------");
  })
  .catch((err) => console.log("Error", err));

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "حدث خطأ غير متوقع في السيرفر" });
});
app.listen(5000, () => {
  console.log("Server is running on http://localhost:5000");
});
