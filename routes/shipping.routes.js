import express from "express";
import {
  getAllGovernorates,
  updateShippingCost,
  getShippingCostByName,
} from "../controllers/shipping.controllers.js";

const router = express.Router();

router.get("/", getAllGovernorates); // جلب كل المحافظات وتكلفة الشحن
router.put("/", updateShippingCost); // تحديث تكلفة الشحن لمحافظة
router.get("/:name", getShippingCostByName); // جلب تكلفة الشحن حسب اسم المحافظة

export default router;
