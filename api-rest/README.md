# Task Management API

API REST para gerenciamento de tarefas com autenticação via JWT. Cada usuário cria sua conta, faz login e passa a gerenciar apenas as próprias tarefas.

O projeto foi feito com Node.js, Express e MySQL, e serve como base para estudo de autenticação, validação de dados e organização de uma API em camadas.

## Tecnologias

- Node.js e Express
- MySQL (driver `mysql2` com pool de conexões)
- JWT (`jsonwebtoken`) para autenticação
- bcryptjs para hash de senhas
- express-validator para validação de entrada
- helmet e cors para segurança básica
- dotenv para variáveis de ambiente

## Estrutura do projeto

```
.
├── config/
│   └── database.js          # Pool de conexões e teste de conexão com o MySQL
├── controllers/
│   ├── authController.js    # Registro, login e perfil
│   └── tasksController.js   # CRUD de tarefas
├── middleware/
│   └── auth.js              # Verifica o token JWT e identifica o usuário
├── routes/
│   ├── auth.js              # Rotas de autenticação e validações
│   └── tasks.js             # Rotas de tarefas e validações
├── utils/
│   └── errorHandler.js      # Tratamento global de erros
├── database.sql             # Script de criação do banco e das tabelas
├── server.js                # Ponto de entrada da aplicação
├── .env.example             # Modelo das variáveis de ambiente
└── package.json
```

## Como as camadas se conectam

Uma requisição segue sempre o mesmo caminho:

1. `server.js` recebe a requisição e aplica helmet, cors e o parser de JSON.
2. A rota correspondente (`routes/`) valida os dados de entrada.
3. Nas rotas protegidas, o middleware `auth.js` confere o token JWT e preenche `req.user`.
4. O controller executa a regra de negócio e consulta o banco por meio do pool de `config/database.js`.
5. Se algo der errado, o erro vai para o `errorHandler`, que devolve uma resposta padronizada.

## Pré-requisitos

- Node.js 18 ou superior
- MySQL 8 ou superior
- npm

## Instalação

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/SEU-USUARIO/task-management-api.git
   cd task-management-api
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Crie o banco de dados e as tabelas:

   ```bash
   mysql -u root -p < database.sql
   ```

4. Crie o arquivo `.env` a partir do modelo e preencha com os seus dados:

   ```bash
   cp .env.example .env
   ```

5. Inicie a aplicação:

   ```bash
   # desenvolvimento (reinicia ao salvar arquivos)
   npm run dev

   # produção
   npm start
   ```

Se tudo estiver certo, o terminal mostra a mensagem de conexão com o MySQL e o endereço do servidor. Para conferir, acesse `http://localhost:3000/health`.

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente de execução | `development` |
| `DB_HOST` | Endereço do MySQL | `localhost` |
| `DB_PORT` | Porta do MySQL | `3306` |
| `DB_USER` | Usuário do MySQL | `root` |
| `DB_PASSWORD` | Senha do MySQL | `sua_senha` |
| `DB_NAME` | Nome do banco | `task_management_db` |
| `JWT_SECRET` | Chave usada para assinar os tokens | uma string longa e aleatória |
| `JWT_EXPIRE` | Validade do token | `7d` |
| `CORS_ORIGIN` | Origem permitida no CORS em produção | `https://seu-dominio.com` |

O servidor não inicia se o `JWT_SECRET` não estiver definido. Para gerar uma chave segura, você pode usar:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Nunca envie o arquivo `.env` para o GitHub. Ele já está listado no `.gitignore`.

## Endpoints

### Saúde da aplicação

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Confirma que a API está no ar |

### Autenticação

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Não | Cria um novo usuário |
| POST | `/api/auth/login` | Não | Faz login e devolve o token |
| GET | `/api/auth/profile` | Sim | Retorna os dados do usuário logado |

### Tarefas

Todas as rotas abaixo exigem o header `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/tasks` | Lista as tarefas do usuário |
| GET | `/api/tasks/:id` | Busca uma tarefa pelo id |
| POST | `/api/tasks` | Cria uma tarefa |
| PUT | `/api/tasks/:id` | Atualiza uma tarefa |
| PATCH | `/api/tasks/:id/complete` | Marca a tarefa como concluída |
| DELETE | `/api/tasks/:id` | Remove uma tarefa |

A listagem aceita estes parâmetros de consulta:

- `status`: `pending` ou `completed`
- `sort`: `priority` para ordenar da maior para a menor prioridade (por padrão, ordena pelas mais recentes)

Exemplo: `GET /api/tasks?status=pending&sort=priority`

## Exemplos de uso

### Registrar um usuário

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Souza",
    "email": "maria@exemplo.com",
    "password": "123456",
    "passwordConfirm": "123456"
  }'
```

Resposta (201):

```json
{
  "success": true,
  "message": "Usuário registrado com sucesso"
}
```

### Fazer login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "maria@exemplo.com", "password": "123456" }'
```

Resposta (200):

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "name": "Maria Souza", "email": "maria@exemplo.com" }
}
```

### Criar uma tarefa

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "title": "Estudar Node.js",
    "description": "Revisar middlewares e JWT",
    "priority": "high"
  }'
```

Campos aceitos na criação:

| Campo | Obrigatório | Regras |
|---|---|---|
| `title` | Sim | Até 255 caracteres |
| `description` | Não | Até 1000 caracteres |
| `priority` | Não | `low`, `medium` ou `high` (padrão: `medium`) |

### Atualizar uma tarefa

Na atualização todos os campos são opcionais, mas é preciso enviar pelo menos um. Para limpar a descrição, envie `null` ou uma string vazia.

```bash
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{ "status": "completed", "priority": "low" }'
```

## Regras de validação

- Nome: mínimo de 3 caracteres.
- Email: precisa ser válido.
- Senha: mínimo de 6 caracteres, e a confirmação deve ser igual.
- Prioridade: `low`, `medium` ou `high`.
- Status: `pending` ou `completed`.

Quando a validação falha, a API responde 400 com a lista de erros no campo `errors`.

## Formato das respostas

Todas as respostas seguem o mesmo padrão:

```json
{ "success": true, "message": "..." }
```

Em caso de erro, `success` vem como `false` e o campo `message` explica o problema. Os códigos de status mais comuns são:

| Código | Significado |
|---|---|
| 200 / 201 | Sucesso / recurso criado |
| 400 | Dados inválidos |
| 401 | Token ausente, inválido ou expirado, ou credenciais incorretas |
| 404 | Recurso não encontrado |
| 409 | Registro já existe |
| 500 | Erro interno (os detalhes ficam apenas no log do servidor) |

## Segurança

- As senhas são armazenadas com hash (bcrypt), nunca em texto puro.
- O id do usuário vem do token assinado e todas as consultas de tarefas filtram por `user_id`, então um usuário não acessa as tarefas de outro.
- As consultas ao banco usam parâmetros, o que evita SQL injection.
- O helmet adiciona cabeçalhos de segurança HTTP.
- Em produção, defina `CORS_ORIGIN` para liberar apenas o seu domínio.

## Banco de dados

O arquivo `database.sql` cria duas tabelas:

- `users`: id, nome, email (único), senha com hash e datas de criação e atualização.
- `tasks`: id, `user_id` (chave estrangeira para `users`), título, descrição, status, prioridade e datas. Ao excluir um usuário, as tarefas dele são removidas junto.

## Autor

Arthur de Aguiar Santos
