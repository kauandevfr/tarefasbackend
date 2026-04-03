const joi = require("joi");

const updateUserSchema = joi.object({
    name: joi
        .string()
        .allow("")
        .trim()
        .min(3)
        .pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/)
        .messages({
            "string.min": "O nome precisa ter no mínimo 3 caracteres.",
            "string.pattern.base": "O nome deve conter apenas letras e espaços.",
        }),

    email: joi
        .string()
        .allow("")
        .trim()
        .email()
        .messages({
            "string.email": "Email no formato inválido.",
        }),

    phoneNumber: joi
        .string()
        .allow("")
        .trim()
        .pattern(/^\d{10,11}$/)
        .messages({
            "string.pattern.base": "Telefone inválido. Informe 10 ou 11 dígitos numéricos.",
        }),

    currentPassword: joi
        .string()
        .allow("")
        .trim()
        .min(6)
        .messages({
            "string.min": "A sua senha atual precisa ter no mínimo 6 caracteres.",
        }),

    newPassword: joi
        .string()
        .allow("")
        .min(6)
        .messages({
            "string.min": "A nova senha precisa ter no mínimo 6 caracteres.",
        }),

    theme: joi
        .string()
        .allow("")
        .valid("light", "dark")
        .messages({
            "any.only": "O tema deve ser 'light' ou 'dark'.",
        }),
})
    .when(joi.object({ newPassword: joi.exist() }).unknown(), {
        then: joi.object({
            currentPassword: joi
                .string()
                .required()
                .messages({
                    "any.required": "Para alterar a senha, informe a senha atual.",
                }),
        }),
    });

module.exports = updateUserSchema;