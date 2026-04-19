const joi = require('joi');

const addTaskSchema = joi.object({
    title: joi
        .string()
        .trim()
        .pattern(/[A-Za-z0-9]/)
        .required()
        .messages({
            "any.required": "Título obrigatório.",
            "string.empty": "Título obrigatório.",
            "string.pattern.base": "O título precisa conter ao menos uma letra ou número."
        }),

    description: joi
        .string()
        .trim()
        .optional()
        .allow('')
        .messages({
        }),

    createdat: joi
        .date()
        .required()
        .messages({
            "any.required": "Data de criação obrigatória.",
            "date.base": "Data inválida."
        }),

    priority: joi
        .string()
        .valid('high', 'medium', 'low')
        .required()
        .messages({
            "any.required": "Prioridade obrigatória.",
            "any.only": "Prioridade inválida."
        }),

    completed: joi
        .boolean()
        .required()
        .messages({
            "any.required": "Estado obrigatório.",
            "boolean.base": "O estado só pode ser verdadeiro ou falso."
        }),

    repeat: joi
        .string()
        .valid('daily', 'weekly')
        .optional()
        .allow(null, '')
        .messages({
            "any.only": "Recorrência inválida."
        })
});

module.exports = addTaskSchema;