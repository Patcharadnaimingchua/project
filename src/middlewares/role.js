const { errors } = require('../utils/messages');

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: errors.FORBIDDEN,
    });
  }
  next();
};