const validateError = (error, res) => {
    console.error(error);

    return res.status(500).json({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
        code: "INTERNAL_SERVER_ERROR",
        status: 500,
    });
};

module.exports = validateError;