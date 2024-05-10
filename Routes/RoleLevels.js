const User = require("../modules/UserSchema");
const Roles = require("./Roles");
const jwt = require("jsonwebtoken");
const secretKey = "mytestsecretkey";

const LevelsRoutes = async (req, res, next) => {
  try {
    // Extract token from authorization header
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized - Missing or invalid token" });
    }
    const token = authorizationHeader.split(" ")[1];
    
    // Verify and decode the token
    const decodedToken = jwt.verify(token, secretKey);
    req.user = { userId: decodedToken.userId, email: decodedToken.email };

    // Fetch user from database
    const user = await User.findOne({ _id: req.user ? req.user.userId : undefined });
    if (!user) {
      return res.status(400).send("No User");
    }

    // Check user role and grant access accordingly
    const userRole = user.userRole;
    if (
      userRole === Roles.SUPER_ADMIN ||
      userRole === Roles.DEPARTMENT_HEAD ||
      (userRole === Roles.PROJECT_LEAD && (req.method === "GET" || req.method === "POST")) ||
      (userRole === Roles.MEMBER && req.method === "GET")
    ) {
      next(); // Grant access
    } else {
      return res.status(403).json({ message: "Access not allowed for the user's role" });
    }
  } catch (error) {
    console.log("Catch error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = LevelsRoutes;
