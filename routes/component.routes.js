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
} from "../controllers/component.controllers.js";

const router = express.Router();

router.post("/", upload.single("image"), createComponent);
router.get("/", getAllComponents);
router.put("/:id", upload.single("image"), updateComponent);
router.delete("/:id", deleteComponent);

router.post("/:id/stock-in", stockInComponent);
router.post("/:id/adjust", adjustComponentStock);
router.get("/movements", getComponentMovements);

export default router;
