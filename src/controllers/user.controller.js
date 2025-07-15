import User from "../models/user.model.js";
import moment from "moment";

export const getCurrentUser = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(200).json({
      success: false,
      message: "No token found. User not logged in.",
      user: null,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        user: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User fetched successfully.",
      user,
    });

  } catch (error) {
    console.error("Error in getCurrentUser:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      user: null,
    });
  }
};

import geminiResponse from "../../gemini.js";

export const updateAssistant = async (req, res) => {
  try {
    console.log("=== UPDATE ASSISTANT DEBUG ===");
    console.log("req.body:", req.body);

    const { assistantName, imageURL } = req.body;
    console.log(assistantName, imageURL);

    if (!assistantName) {
      return res.status(400).json({ message: "Assistant name is required" });
    }

    if (!imageURL) {
      return res.status(400).json({ message: "Image URL is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        assistantName,
        assistantImage: imageURL, 
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("updateAssistant error:", error.message);
    return res.status(500).json({
      message: "updateAssistant error",
      error: error.message,
    });
  }
};

export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);
    user.history.push(command);
    user.save();
    const userName = user.name;
    const assistantName = user.assistantName;
    const result = await geminiResponse(command, assistantName, userName);

    const jsonMatch = result.match(/{[\s\S]*}/);

    console.log("gemini api response", result);

    if (!jsonMatch) {
      return res.status(400).json({ response: "Sorry, i can't understand" });
    }

    const gemResult = JSON.parse(jsonMatch[0]);
    const type = gemResult.type;

    switch (type) {
      case "get-date":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current date is ${moment().format("YYYY-MM-DD")}`,
        });

      case "get-day":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `today is ${moment().format("dddd")}`,
        });

      case "get-month":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current month is ${moment().format("MMMM")}`,
        });

      case "get-time":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: `current time is ${moment().format("hh:mmA")}`,
        });
      case "general":
      case "google-search":
      case "youtube-search":
      case "youtube-play":
      case "calculator-open":
      case "instagram-open":
      case "facebook-open":
      case "weather-show":
      case "github-open":
      case "linkedin-open":
        return res.json({
          type,
          userInput: gemResult.userInput,
          response: gemResult.response,
        });

      default:
        return res
          .status(400)
          .json({ response: "I didn't understand that command. " });
    }
  } catch (error) {
    return res.status(500).json({ response: "ask assistant error" });
  }
};
