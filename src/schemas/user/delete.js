const joi = require("joi");

const deleteAccountSchema = joi.object({
    password: joi.string().trim().required().messages({
        "any.required": "Senha obrigatória para excluir a conta.",
        "string.empty": "Senha obrigatória para excluir a conta.",
    }),
});

module.exports = deleteAccountSchema;