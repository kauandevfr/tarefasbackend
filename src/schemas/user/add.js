const joi = require('joi');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;

const registerUserSchema = joi.object({
    name: joi.string().trim().required().messages({
        "any.required": "Nome obrigatório.",
        "string.empty": "Nome obrigatório.",
    }),

    email: joi.string().trim().required().email().messages({
        "any.required": "Email obrigatório.",
        "string.empty": "Email obrigatório.",
        "string.email": "Email no formato inválido.",
    }),

    password: joi.string().trim().required().pattern(passwordRegex).messages({
        "any.required": "Senha obrigatória.",
        "string.empty": "Senha obrigatória.",
        "string.pattern.base": "A senha precisa ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.",
    }),
});


module.exports = registerUserSchema;