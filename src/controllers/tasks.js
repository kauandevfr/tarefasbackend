const knex = require("../connections/database");
const validateError = require("../utils/validateError");
const bcrypt = require("bcrypt");

const listTasks = async (req, res) => {
    const { id } = req.user;
    const { date, month } = req.query;

    try {
        const query = knex("tasks").where({ user_id: id });

        if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            query.andWhere("createdat", date);
        } else if (month && /^\d{4}-\d{2}$/.test(month)) {
            query.andWhere(knex.raw("to_char(createdat, 'YYYY-MM')"), month);
        }

        const tasks = await query.orderBy("createdat", "desc");

        return res.status(200).json(tasks);
    } catch (error) {
        return validateError(error, res);
    }
};

const registerTask = async (req, res) => {
    const { id } = req.user;

    try {
        const [task] = await knex("tasks")
            .insert({ ...req.body, user_id: id })
            .returning("*");

        return res.status(201).json({
            message: "Tarefa criada com sucesso.",
            code: "TASK_CREATED",
            status: 201,
            data: task,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const updateTask = async (req, res) => {
    const { id } = req.params;
    const { user } = req;

    try {
        const updateData = { ...req.body };

        if (req.body.createdat) {
            updateData.createdat = new Date(req.body.createdat).toISOString().slice(0, 10);
        }

        const updated = await knex("tasks")
            .update(updateData)
            .where({ id, user_id: user.id });

        if (!updated) {
            return res.status(404).json({
                message: "Tarefa não encontrada.",
                code: "TASK_NOT_FOUND",
                status: 404,
            });
        }

        return res.status(200).json({
            message: "Tarefa atualizada com sucesso.",
            code: "TASK_UPDATED",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const deleteTask = async (req, res) => {
    const { id } = req.params;
    const { user } = req;

    try {
        const deleted = await knex("tasks")
            .where({ id, user_id: user.id })
            .del();

        if (!deleted) {
            return res.status(404).json({
                message: "Tarefa não encontrada.",
                code: "TASK_NOT_FOUND",
                status: 404,
            });
        }

        return res.status(200).json({
            message: "Tarefa excluída com sucesso.",
            code: "TASK_DELETED",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const deleteAllTasks = async (req, res) => {
    const { id } = req.user;
    const { password } = req.body;

    try {

        const user = await knex("users").where({ id }).first();

        if (!user) {
            return res.status(404).json({
                message: "Usuário não encontrado.",
                code: "USER_NOT_FOUND",
                status: 404,
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Credencial inválida",
                code: "INVALID_PASSWORD",
                status: 401,
            });
        }

        const deleted = await knex("tasks").where({ user_id: id }).del();

        if (!deleted) {
            return res.status(404).json({
                message: "Nenhuma tarefa encontrada.",
                code: "TASKS_NOT_FOUND",
                status: 404,
            });
        }

        return res.status(200).json({
            message: "Todas as tarefas foram excluídas.",
            code: "ALL_TASKS_DELETED",
            status: 200,
        });
    } catch (error) {
        return validateError(error, res);
    }
};

const listOverdueTasks = async (req, res) => {
    const { id } = req.user;
    const today = new Date().toISOString().split('T')[0];

    try {
        const rows = await knex('tasks')
            .select(knex.raw("to_char(createdat, 'YYYY-MM-DD') as date"))
            .count('* as count')
            .where({ user_id: id, completed: false })
            .andWhere('createdat', '<', today)
            .groupBy('createdat')
            .orderBy('createdat', 'desc');

        return res.status(200).json(rows);
    } catch (error) {
        return validateError(error, res);
    }
};

const createRecurringTasks = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayDow = new Date().getDay();

    try {
        const originals = await knex('tasks')
            .whereNotNull('repeat')
            .whereNull('origin_id');

        for (const task of originals) {
            const taskDow = new Date(task.createdat + 'T12:00:00').getDay();

            const shouldCreate =
                task.repeat === 'daily' ||
                (task.repeat === 'weekly' && taskDow === todayDow);

            if (!shouldCreate) continue;

            const alreadyExists = await knex('tasks')
                .where({ origin_id: task.id, createdat: today })
                .first();

            if (alreadyExists) continue;

            await knex('tasks').insert({
                title: task.title,
                description: task.description,
                priority: task.priority,
                completed: false,
                repeat: task.repeat,
                origin_id: task.id,
                user_id: task.user_id,
                createdat: today,
            });
        }

        console.log(`[cron] Recorrências criadas para ${today}`);
    } catch (error) {
        console.error('[cron] Erro ao criar recorrências:', error);
    }
};

module.exports = { registerTask, updateTask, listTasks, deleteTask, deleteAllTasks, listOverdueTasks, createRecurringTasks };