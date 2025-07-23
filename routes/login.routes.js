// routes/login.routes.js
import express from "express";
import {
  login,
  updateUserLogin,
  logout,
} from "../controllers/login.controllers.js";

const router = express.Router();

router.post("/login", login);
router.put("/update", updateUserLogin);
router.post("/logout", logout);

export default router;
