import express from "express";
import upload from "../middlewares/uploadImage.js";
import {
  createComponent,
  getAllComponents,
  updateComponent,
  deleteComponent,
  stockInComponent,
  adjustComponentStock,
  getComponentMovements,
  getComponentById,
  getComponentsByProductId,
  getStoreComponents,
} from "../controllers/component.controllers.js";

const router = express.Router();

router.post("/", upload.array("images", 1), createComponent);
router.get("/", getAllComponents);
router.get("/store", getStoreComponents);
router.get("/movements", getComponentMovements);
router.get("/product/:id", getComponentsByProductId);
router.get("/:id", getComponentById);
router.put("/:id", upload.array("images", 1), updateComponent);
router.delete("/:id", deleteComponent);

router.post("/:id/stock-in", stockInComponent);
router.post("/:id/adjust", adjustComponentStock);

export default router;
