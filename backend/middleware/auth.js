import jwt from "jsonwebtoken";
import User from "../models/User";

const protect = async (req, res, next) => {
  let token;
  //chek if token exists.
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-passwword");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: "User not found",
          statusCode: 401,
        });
      }
      next();
    } catch (error) {
      console.error("Auth middleware error: ", error.message);

      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Token has expired",
          statusCode: 401,
        });
      }
      return res.status(401).json({
        success: false,
        error: "NOt authorized, token failed",
        statusCode: 401,
      });
    }
  }
  if (!token) {
    return res.status(401).json({
      success: false,
      error: "NOt authorized, token failed",
      statusCode: 401,
    });
  }
};

export default protect;
