const joi = require("joi");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;

const resetPasswordSchema = joi.object({
    password: joi.string().trim().required().pattern(passwordRegex).messages({
        "any.required": "Senha obrigatória.",
        "string.empty": "Senha obrigatória.",
        "string.pattern.base": "A senha precisa ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.",
    }),
});

module.exports = resetPasswordSchema;