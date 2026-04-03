const validateRequest = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        return res.status(400).json({
            message: error.details[0].message,
            code: "VALIDATION_ERROR",
            status: 400,
        });
    }

    next();
};

module.exports = validateRequest;