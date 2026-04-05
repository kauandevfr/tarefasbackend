# 🗂️ Tarefas API

API RESTful para gerenciamento de tarefas com autenticação JWT, refresh tokens e upload de avatar.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

---

## 📋 Índice

- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação](#-autenticação)
- [Rotas](#-rotas)
  - [Usuário](#-usuário)
  - [Tarefas](#-tarefas)
  - [Sessão](#-sessão)
- [Validações](#-validações)
- [Padrão de Resposta](#-padrão-de-resposta)
- [Middlewares](#-middlewares)
- [Segurança](#-segurança)

---

## 🚀 Tecnologias

| Tecnologia | Uso |
|---|---|
| **Node.js** | Runtime |
| **Express** | Framework HTTP |
| **Knex.js** | Query builder |
| **PostgreSQL** | Banco de dados |
| **JWT** | Autenticação |
| **Bcrypt** | Hash de senhas |
| **Joi** | Validação de dados |
| **Sharp** | Processamento de imagens |
| **Multer** | Upload de arquivos |
| **express-rate-limit** | Proteção contra brute force |

---

## 📦 Instalação

```bash
git clone https://github.com/kauandevfr/tarefas_backend.git
cd tarefas_backend
npm install
```

---

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=
DB_URL=
JWT_KEY=
PUBLIC_URL=
APP_URL=
EMAIL_KEY=
NODE_ENV=
```

---

## 🗄️ Banco de Dados

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phonenumber VARCHAR(11),
    avatar TEXT,
    theme VARCHAR(5) DEFAULT 'dark',
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal',
    createdat DATE DEFAULT CURRENT_DATE
);

CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔑 Autenticação

A API utiliza o sistema **Access Token + Refresh Token**:

| Token | Tipo | Duração | Armazenamento |
|---|---|---|---|
| **Access Token** | JWT | 15 minutos | Cookie `httpOnly` |
| **Refresh Token** | Random hex | 7 dias | Cookie `httpOnly` + Banco de dados |

### Fluxo

1. **Login** → Retorna `access_token` (15min) + `refresh_token` (7d) via cookies
2. **Requisições** → Usa o `access_token` automaticamente
3. **Token expira** → Frontend chama `POST /refresh` → Novos tokens são gerados (rotation)
4. **Refresh expira** → Usuário precisa fazer login novamente
5. **Logout** → Deleta refresh token do banco + limpa cookies

---

## 📡 Rotas

### 👤 Usuário

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/user/register` | ❌ | Cadastrar usuário |
| `POST` | `/user/login` | ❌ | Login |
| `POST` | `/user/logout` | ✅ | Logout |
| `GET` | `/user` | ✅ | Dados do usuário logado |
| `PUT` | `/user/update` | ✅ | Atualizar dados do usuário |
| `PUT` | `/user/avatar` | ✅ | Upload de avatar |
| `DELETE` | `/user/avatar` | ✅ | Remover avatar |
| `DELETE` | `/user` | ✅ | Excluir conta |

#### `POST /user/register`

```json
{
    "name": "Kauan Rodrigues",
    "email": "kauan@email.com",
    "password": "Senha@123"
}
```

**Resposta `201`:**
```json
{
    "message": "Usuário cadastrado com sucesso.",
    "code": "USER_CREATED",
    "status": 201
}
```

#### `POST /user/login`

```json
{
    "email": "kauan@email.com",
    "password": "Senha@123"
}
```

**Resposta `200`:**
```json
{
    "message": "Login realizado com sucesso.",
    "code": "LOGIN_SUCCESS",
    "status": 200
}
```

#### `PUT /user/update`

Todos os campos são opcionais:

```json
{
    "name": "Novo Nome",
    "email": "novo@email.com",
    "phoneNumber": "11988888888",
    "currentPassword": "Senha@123",
    "newPassword": "NovaSenha@456",
    "theme": "light"
}
```

> ⚠️ Para alterar a senha, `currentPassword` é obrigatório.

#### `PUT /user/avatar`

Enviar como `multipart/form-data` com o campo `avatar`.

- Formato de saída: **WebP** (qualidade 82)
- Armazenado em: `assets/uploads/{userId}/`
- Avatar antigo é excluído automaticamente

---

### 📝 Tarefas

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `GET` | `/tasks` | ✅ | Listar tarefas |
| `POST` | `/task` | ✅ | Criar tarefa |
| `PUT` | `/task/:id` | ✅ | Atualizar tarefa |
| `DELETE` | `/task/:id` | ✅ | Excluir tarefa |

#### `GET /tasks`

Query params opcionais:

| Param | Formato | Exemplo |
|---|---|---|
| `date` | `YYYY-MM-DD` | `2026-04-03` |
| `month` | `YYYY-MM` | `2026-04` |

#### `POST /task`

```json
{
    "title": "Minha tarefa",
    "description": "Descrição opcional",
    "priority": "high",
    "completed": false,
    "createdat": "2026-04-03"
}
```

**Resposta `201`:**
```json
{
    "message": "Tarefa criada com sucesso.",
    "code": "TASK_CREATED",
    "status": 201,
    "data": { ... }
}
```

#### `PUT /task/:id`

```json
{
    "title": "Tarefa atualizada",
    "completed": true
}
```

**Resposta `200`:**
```json
{
    "message": "Tarefa atualizada com sucesso.",
    "code": "TASK_UPDATED",
    "status": 200
}
```

> O campo `completed` aceita `true` ou `false` para sinalizar se a tarefa foi concluída.

---

### 🔄 Sessão

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| `POST` | `/refresh` | ❌ | Renovar tokens |

**Resposta `200`:**
```json
{
    "message": "Sessão renovada com sucesso.",
    "code": "SESSION_REFRESHED",
    "status": 200
}
```

---

## ✅ Validações

Todas as validações são feitas com **Joi** antes de chegar no controller.

### Registro de Usuário

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `name` | string | ✅ | — |
| `email` | string | ✅ | Formato de email válido |
| `password` | string | ✅ | Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial |

### Atualização de Usuário

| Campo | Tipo | Obrigatório | Regras |
|---|---|---|---|
| `name` | string | ❌ | Mínimo 3 caracteres, apenas letras e espaços |
| `email` | string | ❌ | Formato de email válido |
| `phoneNumber` | string | ❌ | 10 ou 11 dígitos numéricos |
| `currentPassword` | string | ❌* | Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial |
| `newPassword` | string | ❌ | Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial |
| `theme` | string | ❌ | `"light"` ou `"dark"` |

> \* Obrigatório quando `newPassword` é enviado.

---

## 📦 Padrão de Resposta

Todas as respostas seguem o padrão:

```json
{
    "message": "Descrição da resposta.",
    "code": "RESPONSE_CODE",
    "status": 200
}
```

Quando há dados:

```json
{
    "message": "Descrição da resposta.",
    "code": "RESPONSE_CODE",
    "status": 200,
    "data": { ... }
}
```

### Códigos de Resposta

| Code | Status | Descrição |
|---|---|---|
| `USER_CREATED` | 201 | Usuário cadastrado |
| `LOGIN_SUCCESS` | 200 | Login realizado |
| `LOGOUT_SUCCESS` | 200 | Logout realizado |
| `USER_FOUND` | 200 | Dados do usuário retornados |
| `USER_UPDATED` | 200 | Usuário atualizado |
| `USER_DELETED` | 200 | Conta excluída |
| `AVATAR_UPDATED` | 200 | Avatar atualizado |
| `AVATAR_DELETED` | 200 | Avatar removido |
| `TASK_CREATED` | 201 | Tarefa criada |
| `TASK_UPDATED` | 200 | Tarefa atualizada |
| `TASK_DELETED` | 200 | Tarefa excluída |
| `TASKS_LISTED` | 200 | Tarefas listadas |
| `SESSION_REFRESHED` | 200 | Sessão renovada |
| `VALIDATION_ERROR` | 400 | Erro de validação |
| `NO_UPDATE_DATA` | 400 | Nenhum dado para atualizar |
| `AVATAR_REQUIRED` | 400 | Avatar não enviado |
| `AVATAR_NOT_FOUND` | 400 | Nenhum avatar para remover |
| `INVALID_CREDENTIALS` | 401 | Email ou senha incorretos |
| `INVALID_CURRENT_PASSWORD` | 401 | Senha atual incorreta |
| `TOKEN_MISSING` | 401 | Token não encontrado |
| `TOKEN_EXPIRED` | 401 | Token expirado |
| `TOKEN_INVALID` | 401 | Token inválido |
| `REFRESH_TOKEN_MISSING` | 401 | Refresh token não encontrado |
| `REFRESH_TOKEN_EXPIRED` | 401 | Refresh token expirado |
| `USER_NOT_FOUND` | 401 | Usuário não encontrado |
| `EMAIL_ALREADY_EXISTS` | 409 | Email já cadastrado |
| `TASK_NOT_FOUND` | 404 | Tarefa não encontrada |
| `TOO_MANY_REQUESTS` | 429 | Muitas tentativas |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno |

---

## 🛡️ Middlewares

| Middleware | Descrição |
|---|---|
| `authentication` | Valida o access token JWT e injeta `req.user` |
| `validateRequest` | Valida o body da requisição com schema Joi |
| `multer` | Processa upload de arquivos (avatar) |
| `loginLimiter` | Rate limit no login (10 tentativas / 15min) |

---

## 🔒 Segurança

- ✅ Senhas hasheadas com **bcrypt** (salt rounds: 10)
- ✅ Política de senha forte (mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial)
- ✅ Tokens JWT com expiração curta (15min)
- ✅ Refresh token rotation (token antigo é invalidado a cada refresh)
- ✅ Cookies `httpOnly` + `secure` + `sameSite`
- ✅ Rate limiting no login
- ✅ Limpeza automática de refresh tokens expirados (a cada 24h)
- ✅ CORS configurado com whitelist de origens
- ✅ Validação de entrada com Joi em todas as rotas

---

> Desenvolvido por [Kauan Rodrigues](https://github.com/kauandevfr)
