import express from "express";
const router = express.Router();
import { getSettings, updateSettings } from "../controllers/systemSettings.controller.js";

router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
