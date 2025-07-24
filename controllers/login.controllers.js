import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.model.js";

export const login = async (req, res) => {
  const { username, password } = req.body;

  const admin = await AdminUser.findOne({ username });
  if (!admin || admin.password !== password) {
    return res
      .status(401)
      .json({ message: "اسم المستخدم او كلمة المرور غير صحيح" });
  }

  const token = jwt.sign(
    { id: admin._id, username: admin.username },
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
  app.post("/api/user/logout", (req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });
    res.status(200).json({ message: "تم تسجيل الخروج بنجاح" });
  });
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
