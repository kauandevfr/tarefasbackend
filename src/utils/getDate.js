const getDate = () => {
    const agora = new Date();

    const data_hora = agora.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return data_hora
}

module.exports = { getDate }