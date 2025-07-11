import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../config/token.js";
import dotenv from 'dotenv'

dotenv.config()

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existEmail = await userModel.findOne({ email });

    if (existEmail) {
      return res.status(400).json({
        message: "email already exists !",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "password must be at least 6 characters !",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      name,
      email,
      password: hashPassword,
    });

    const token = await genToken(user._id);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite:  "none",
      secure: true // true on Render/Prod, false on localhost
    });

    return res.status(201).json({
      message: "signUp successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: `sign up error ${error}`,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "email does not exists !",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "incorrect password",
      });
    }

    const token = await genToken(user._id);

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite:  "none",
      secure: true // true on Render/Prod, false on localhost
    });

    return res.status(200).json({
      message: "login successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: `login error ${error}`,
    });
  }
};

export const logOut = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "log out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: `login error ${error}`,
    });
  }
};
