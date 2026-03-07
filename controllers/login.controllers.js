import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.model.js";

export const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await AdminUser.findOne({ username: username.trim() });
    if (!admin || admin.password !== password) {
      return res
        .status(401)
        .json({ message: "اسم المستخدم او كلمة المرور غير صحيح" });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.type },
      process.env.JWT_SECRET
    );
    //   const token = jwt.sign({ username: admin.username }, process.env.JWT_SECRET, {
    //     expiresIn: "30d",
    //   });

    res
      .cookie("token", token, {
        httpOnly: false,
        secure: true,
        sameSite: "None",
      })
      .status(200)
      .json({ message: "تم تسجيل الدخول بنجاح", token });
  } catch (error) {
    res.status(500).json({ message: "فشل في تسجيل الدخول", error });
  }
};

export const updateUserLogin = async (req, res) => {
  const { id, username, password } = req.body;

  try {
    const admin = await AdminUser.findOne({ _id: id });
    if (!admin) {
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }
    if (username) admin.username = username;
    if (password) admin.password = password;
    await admin.save();
    res.status(200).json({ message: "تم تحديث بيانات المستخدم بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "فشل في تحديث بيانات المستخدم", error });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "None",
    secure: true,
  });
  res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
};

export const verifyToken = (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "لا يوجد توكن" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ user: decoded });
  } catch (err) {
    res.status(401).json({ message: "التوكن غير صحيح" });
  }
};

export const addUser = async (req, res) => {
  const { username, password, type } = req.body;

  try {
    if (!username || !password || !type) {
      return res.status(400).json({ message: "يرجى تعبئة جميع الحقول المطلوبة" });
    }

    const existingUser = await AdminUser.findOne({ username: username.trim() });
    if (existingUser) {
      return res.status(400).json({ message: "اسم المستخدم موجود بالفعل" });
    }

    const newUser = new AdminUser({
      username: username.trim(),
      password, // Note: In a real app, hash this before saving
      type,
    });

    await newUser.save();
    res.status(201).json({ message: "تم إضافة المستخدم بنجاح", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "فشل في إضافة المستخدم", error });
  }
};
