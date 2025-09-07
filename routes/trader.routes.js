// routes/trader.routes.js
import express from "express";
import {
  createTrader,
  getAllTraders,
  getTraderById,
  updateTrader,
  createTraderOrder,
  updateTraderOrder,
  deleteTraderOrder,
  recordPayment,
  updatePayment,
  deletePayment,
  getTotalProfit,
  getTraderOrders,
  getTraderPayments,
  getProfitHistory,
} from "../controllers/trader.controllers.js";

const router = express.Router();

// مسارات التجار
router.post("/", createTrader); // إنشاء تاجر جديد
router.get("/", getAllTraders); // جلب جميع التجار
router.get("/:id", getTraderById); // جلب تاجر محدد مع إحصائياته
router.put("/:id", updateTrader); // تعديل بيانات التاجر
router.get("/:id/orders", getTraderOrders); // جلب طلبات التاجر
router.get("/:id/payments", getTraderPayments); // جلب دفعات التاجر

// مسارات طلبات التجار
router.post("/orders", createTraderOrder); // إنشاء طلب للتاجر
router.put("/orders/:id", updateTraderOrder); // تعديل طلب
router.delete("/orders/:id", deleteTraderOrder); // حذف طلب

// مسارات الدفعات
router.post("/payments", recordPayment); // تسجيل دفعة
router.put("/payments/:id", updatePayment); // تعديل دفعة
router.delete("/payments/:id", deletePayment); // حذف دفعة

// مسارات الأرباح
router.get("/profits/total", getTotalProfit); // إجمالي الأرباح
// Express.js example
router.get("/profits/history", getProfitHistory); // سجل الأرباح

export default router;
