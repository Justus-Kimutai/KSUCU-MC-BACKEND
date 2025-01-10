const jwt = require('jsonwebtoken');
const pkg = require('jsonwebtoken');
const { verify } = pkg;

const secretKey = process.env.JWT_USER_SECRET;

module.exports = (req, res, next) => {
  const token = req.cookies.user_s;
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Authentication failed: No token provided.' });
  }else{
    console.log(token);
  }

  verify(token, secretKey, (err, decoded) => {
    if (err) {
      console.log(err);
      
      return res.status(403).json({ message: `Authentication failed: ${err.message}` });
    }
    
    req.userId = decoded.userId;
    next();
  });
};