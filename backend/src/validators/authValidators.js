const { body } = require('express-validator')

const passwordMessage = 'Password must be at least 8 characters and include a letter and a number.'

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 120 }).withMessage('Name is too long.'),
  body('phone').trim().notEmpty().withMessage('Phone is required.'),
  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .isLength({ max: 255 })
    .withMessage('Email is too long.'),
  body('password').isString().matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/).withMessage(passwordMessage),
  body('passwordConfirmation')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password confirmation must match password.'),
  body('role').isIn(['farmer', 'buyer']).withMessage('Role must be farmer or buyer.'),
  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required.')
    .isLength({ max: 160 })
    .withMessage('Location is too long.'),
]

const loginValidator = [
  body('identifier').trim().notEmpty().withMessage('Phone or email is required.'),
  body('password').isString().notEmpty().withMessage('Password is required.'),
]

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Enter a valid email address.'),
]

const resetPasswordValidator = [
  body('token').trim().notEmpty().withMessage('Reset token is required.'),
  body('password').isString().matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/).withMessage(passwordMessage),
  body('passwordConfirmation')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Password confirmation must match password.'),
]

module.exports = {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
}
