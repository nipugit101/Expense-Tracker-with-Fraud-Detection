//server--->middleware--->validation.js
const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed 1',
      errors: errors.array()
    });
  }
  next();
};

const registerValidation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const transactionValidation = [
  body('type')
    .isIn(['income', 'expense', 'transfer_in', 'transfer_out'])
    .withMessage('Invalid transaction type'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  handleValidationErrors
];

const transferValidation = [
  body('toEmail')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid recipient email'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Description must be between 1 and 200 characters'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  transactionValidation,
  transferValidation,
  handleValidationErrors
};
