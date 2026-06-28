const jwt = require("jsonwebtoken");
const { JsonWebTokenError } = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables.");
}

// 1. Structural Fix: The function now takes the required 'role' argument 
//    and RETURNS the actual Express middleware function (req, res, next).
const authJWT = (requiredRole) => {
    
    // This inner function is the actual middleware that runs on every request
    return (req, res, next) => {
        try {
            // Check for the token, usually Bearer Token format
            const tokenHeader = req.headers.authorization; 
            if (!tokenHeader || !tokenHeader.startsWith('Bearer ')) {
                throw new JsonWebTokenError("Token missing or malformed.");
            }
            // Extract the token string
            const token = tokenHeader.split(' ')[1]; 

            const decoded = jwt.verify(token, JWT_SECRET);
            
            // 2. Role Check: Ensure the decoded token has the required role
            if (requiredRole && decoded.role !== requiredRole) {
                 return res.status(403).json({ error: "Insufficient privileges." });
            }

            req.authData = decoded;
            next(); // Move to the next middleware or final controller
        }
        catch (err) {
            console.log(err);
            // 3. Syntax Fix: Removed the extra 's'
            return res.status(401).json({ error: "not authorized." }); 
        }
    }
}

module.exports = { authJWT, JWT_SECRET };