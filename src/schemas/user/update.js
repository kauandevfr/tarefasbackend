const joi = require("joi");

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;

const updateUserSchema = joi.object({
    name: joi.string().allow("").trim().min(3)
        .pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/)
        .messages({
            "string.min": "O nome precisa ter no mínimo 3 caracteres.",
            "string.pattern.base": "O nome deve conter apenas letras e espaços.",
        }),

    email: joi.string().allow("").trim().email().messages({
        "string.email": "Email no formato inválido.",
    }),

    phoneNumber: joi.string().allow("").trim().pattern(/^\d{10,11}$/).messages({
        "string.pattern.base": "Telefone inválido. Informe 10 ou 11 dígitos numéricos.",
    }),

    currentPassword: joi.string().allow("").trim().pattern(passwordRegex).messages({
        "string.pattern.base": "A senha atual precisa ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.",
    }),

    newPassword: joi.string().allow("").pattern(passwordRegex).messages({
        "string.pattern.base": "A nova senha precisa ter no mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.",
    }),

    theme: joi.string().allow("").valid("light", "dark").messages({
        "any.only": "O tema deve ser 'light' ou 'dark'.",
    }),
})
    .when(joi.object({ newPassword: joi.exist() }).unknown(), {
        then: joi.object({
            currentPassword: joi.string().required().messages({
                "any.required": "Para alterar a senha, informe a senha atual.",
            }),
        }),
    });

module.exports = updateUserSchema;