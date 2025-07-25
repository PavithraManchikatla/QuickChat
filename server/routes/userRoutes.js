import express from "express";
import {
  login,
  signup,
  updateProfile,
  checkAuth,
  deleteAccount
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);
userRouter.delete("/delete", protectRoute, deleteAccount); // ✅ delete route

export default userRouter;
