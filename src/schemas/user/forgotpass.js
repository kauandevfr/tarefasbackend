// schemas/user/forgotPassword.js
const joi = require("joi");

const forgotPasswordSchema = joi.object({
    email: joi.string().trim().required().email().messages({
        "any.required": "Email obrigatório.",
        "string.empty": "Email obrigatório.",
        "string.email": "Email no formato inválido.",
    }),
});

module.exports = forgotPasswordSchema;