const jwt = require('jsonwebtoken');

console.log("//... Authenticate middleware triggered!"); // for debugging

// Checks if the request has a valid JWT
exports.authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied: No Token Provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("//... Token verified:", decoded); // for debugging
    req.user = decoded; // Attach user details to the request
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please log in again." });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Invalid Token" });
    } else {
      return res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
};

// Restricts access to admins only.
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "Forbidden: No Role Found" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: Access Denied" });
    }
    
    next();
  };
};
