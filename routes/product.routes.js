import express from "express";
import upload from "../middlewares/uploadImage.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import {
  manufactureProduct,
  getAllManufacturedProducts,
  getUnitsByBatchNumber,
  getAllProductsUnits,
  sellSelectedUnits,
  getSalesHistory,
} from "../controllers/manufacturing.controller.js";

const router = express.Router();

router.post("/", upload.single("image"), createProduct);
router.get("/", getAllProducts);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);
router.post("/manufacture", manufactureProduct);
router.get("/manufacture", getAllManufacturedProducts);
router.get("/units/batch/:batchNo", getUnitsByBatchNumber);
router.get("/units", getAllProductsUnits);
router.post("/sell", sellSelectedUnits);
router.get("/sell", getSalesHistory);
export default router;
