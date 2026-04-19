const joi = require('joi');

const updateTaskSchema = joi.object({
    title: joi
        .string()
        .trim()
        .pattern(/[A-Za-z0-9]/)
        .optional()
        .messages({
            "string.empty": "Título não pode ser vazio.",
            "string.pattern.base": "O título precisa conter ao menos uma letra ou número."
        }),

    description: joi
        .string()
        .trim()
        .optional()
        .allow('')
        .messages({
            "string.empty": "Descrição não pode ser vazia.",
        }),

    createdat: joi
        .date()
        .optional()
        .messages({
            "date.base": "Data inválida."
        }),

    priority: joi
        .string()
        .valid('high', 'medium', 'low')
        .optional()
        .messages({
            "any.only": "Prioridade inválida."
        }),

    completed: joi
        .boolean()
        .optional()
        .messages({
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

module.exports = updateTaskSchema;