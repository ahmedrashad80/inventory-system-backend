import express from "express";
import upload from "../middlewares/uploadImage.js";
import {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProductById,
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

router.post("/", upload.array("image", 5), createProduct);
router.get("/", getAllProducts);
router.put("/:id", upload.array("image", 5), updateProduct);
router.delete("/:id", deleteProduct);
router.post("/manufacture", manufactureProduct);
router.get("/manufacture", getAllManufacturedProducts);
router.get("/units/batch/:batchNo", getUnitsByBatchNumber);
router.get("/units", getAllProductsUnits);
router.post("/sell", sellSelectedUnits);
router.get("/sell", getSalesHistory);
router.get("/:id", getProductById);
export default router;
