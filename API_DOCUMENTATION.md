# Documentação da API - FinanceMobile

Este documento descreve as rotas da API da aplicação FinanceMobile, incluindo descrições, requisitos e endpoints. Esta documentação é destinada a auxiliar na integração futura com sistemas de IA.

## Autenticação (`/auth`)

### Registrar Usuário
- **Endpoint:** `POST /auth/register`
- **Descrição:** Cria uma nova conta de usuário.
- **Requisitos (Body):**
  - `name` (string): Nome do usuário.
  - `email` (string): Email do usuário.
  - `password` (string): Senha do usuário.
- **Retorno:** Objeto contendo dados do usuário (`id`, `name`, `email`, `themePreference`) e token JWT.

### Login
- **Endpoint:** `POST /auth/login`
- **Descrição:** Autentica um usuário existente.
- **Requisitos (Body):**
  - `email` (string): Email do usuário.
  - `password` (string): Senha do usuário.
- **Retorno:** Objeto contendo dados do usuário e token JWT.

### Obter Usuário Atual
- **Endpoint:** `GET /auth/me`
- **Descrição:** Retorna os dados do usuário autenticado.
- **Requisitos (Header):** Token de autenticação (Bearer Token).
- **Retorno:** Dados do usuário (`id`, `name`, `email`, `themePreference`).

### Atualizar Preferências
- **Endpoint:** `PUT /users/preferences`
- **Descrição:** Atualiza as preferências do usuário (ex: tema).
- **Requisitos (Header):** Token de autenticação.
- **Requisitos (Body):**
  - `themePreference` (string): Preferência de tema ('light', 'dark', etc.).
- **Retorno:** Status de sucesso e nova preferência.

---

## Despesas (`/expenses`)

### Listar Despesas
- **Endpoint:** `GET /expenses`
- **Descrição:** Retorna uma lista de despesas do usuário.
- **Requisitos (Query Params):**
  - `startDate` (string, opcional): Data inicial para filtro (ISO 8601).
  - `endDate` (string, opcional): Data final para filtro (ISO 8601).
  - `creditCardId` (string, opcional): ID do cartão de crédito para filtrar.
- **Retorno:** Lista de objetos de despesa.

### Criar Despesa
- **Endpoint:** `POST /expenses`
- **Descrição:** Cria uma nova despesa.
- **Requisitos (Body):**
  - `category` (string): Categoria da despesa.
  - `value` (number): Valor da despesa.
  - `date` (string): Data da despesa.
  - `paymentMethod` (string): Método de pagamento.
  - `isRecurring` (boolean): Se é recorrente.
  - `description` (string, opcional): Descrição.
  - `creditCardId` (string, opcional): ID do cartão de crédito associado.
- **Retorno:** Objeto da despesa criada.

### Atualizar Despesa
- **Endpoint:** `PUT /expenses/:id`
- **Descrição:** Atualiza uma despesa existente.
- **Requisitos (Params):** `id` da despesa.
- **Requisitos (Body):** Mesmos campos de criação.
- **Retorno:** Objeto da despesa atualizada.

### Deletar Despesa
- **Endpoint:** `DELETE /expenses/:id`
- **Descrição:** Remove uma despesa.
- **Requisitos (Params):** `id` da despesa.
- **Retorno:** Status de sucesso.

---

## Receitas (`/incomes`)

### Listar Receitas
- **Endpoint:** `GET /incomes`
- **Descrição:** Retorna uma lista de receitas do usuário.
- **Requisitos (Query Params):**
  - `startDate` (string, opcional): Data inicial.
  - `endDate` (string, opcional): Data final.
- **Retorno:** Lista de receitas.

### Criar Receita
- **Endpoint:** `POST /incomes`
- **Descrição:** Cria uma nova receita.
- **Requisitos (Body):**
  - `category` (string): Categoria.
  - `value` (number): Valor.
  - `date` (string): Data.
  - `isRecurring` (boolean): Recorrência.
  - `description` (string, opcional): Descrição.
  - `goalAllocations` (array, opcional): Alocações para metas (`{ goalId, amount }`).
- **Retorno:** Objeto da receita criada.

### Atualizar Receita
- **Endpoint:** `PUT /incomes/:id`
- **Descrição:** Atualiza uma receita existente.
- **Requisitos (Params):** `id` da receita.
- **Requisitos (Body):** Mesmos campos de criação.
- **Retorno:** Objeto da receita atualizada.

### Deletar Receita
- **Endpoint:** `DELETE /incomes/:id`
- **Descrição:** Remove uma receita.
- **Requisitos (Params):** `id` da receita.
- **Retorno:** Status de sucesso.

---

## Orçamentos (`/budgets`)

### Listar Orçamentos
- **Endpoint:** `GET /budgets`
- **Descrição:** Retorna orçamentos do usuário. Copia orçamentos recorrentes do mês anterior se não existirem no mês atual.
- **Requisitos (Query Params):**
  - `month` (string): Mês no formato 'YYYY-MM'.
- **Retorno:** Lista de orçamentos.

### Criar/Atualizar Orçamento
- **Endpoint:** `POST /budgets`
- **Descrição:** Cria um novo orçamento ou atualiza se já existir para a categoria/mês.
- **Requisitos (Body):**
  - `category` (string): Categoria.
  - `limitAmount` (number): Valor limite.
  - `month` (string): Mês ('YYYY-MM').
  - `isRecurring` (boolean, opcional): Se é recorrente.
- **Retorno:** Objeto do orçamento.

### Atualizar Orçamento (ID)
- **Endpoint:** `PUT /budgets/:id`
- **Descrição:** Atualiza um orçamento específico pelo ID.
- **Requisitos (Params):** `id` do orçamento.
- **Requisitos (Body):** `limitAmount`, `isRecurring`, `category`.
- **Retorno:** Objeto do orçamento atualizado.

### Deletar Orçamento
- **Endpoint:** `DELETE /budgets/:id`
- **Descrição:** Remove um orçamento.
- **Requisitos (Params):** `id` do orçamento.
- **Retorno:** Status de sucesso.

---

## Metas (`/goals`)

### Listar Metas
- **Endpoint:** `GET /goals`
- **Descrição:** Retorna todas as metas do usuário.
- **Retorno:** Lista de metas.

### Criar Meta
- **Endpoint:** `POST /goals`
- **Descrição:** Cria uma nova meta.
- **Requisitos (Body):**
  - `title` (string): Título.
  - `targetAmount` (number): Valor alvo.
  - `currentAmount` (number): Valor atual.
  - `targetDate` (string): Data alvo.
  - `type` (string): Tipo da meta.
  - `category` (string, opcional): Categoria.
- **Retorno:** Objeto da meta criada.

### Atualizar Meta
- **Endpoint:** `PUT /goals/:id`
- **Descrição:** Atualiza uma meta existente.
- **Requisitos (Params):** `id` da meta.
- **Requisitos (Body):** Mesmos campos de criação.
- **Retorno:** Objeto da meta atualizada.

### Deletar Meta
- **Endpoint:** `DELETE /goals/:id`
- **Descrição:** Remove uma meta.
- **Requisitos (Params):** `id` da meta.
- **Retorno:** Status de sucesso.

---

## Alertas (`/alerts`)

### Listar Alertas
- **Endpoint:** `GET /alerts`
- **Descrição:** Retorna alertas do usuário.
- **Requisitos (Query Params):**
  - `unreadOnly` (boolean string, opcional): Se 'true', retorna apenas não lidos.
- **Retorno:** Lista de alertas.

### Criar Alerta
- **Endpoint:** `POST /alerts`
- **Descrição:** Cria um novo alerta.
- **Requisitos (Body):**
  - `type` (string): Tipo do alerta.
  - `message` (string): Mensagem.
  - `category` (string, opcional): Categoria.
  - `isRead` (boolean, opcional): Status de leitura.
- **Retorno:** Objeto do alerta.

### Marcar como Lido
- **Endpoint:** `PUT /alerts/:id/read`
- **Descrição:** Marca um alerta como lido.
- **Requisitos (Params):** `id` do alerta.
- **Retorno:** Status de sucesso.

### Limpar Alertas Antigos
- **Endpoint:** `DELETE /alerts/old`
- **Descrição:** Remove alertas antigos.
- **Requisitos (Body):**
  - `daysOld` (number): Dias para considerar como antigo.
- **Retorno:** Status de sucesso.

---

## Cartões de Crédito (`/credit-cards`)

### Listar Cartões
- **Endpoint:** `GET /credit-cards`
- **Descrição:** Retorna cartões de crédito ativos.
- **Retorno:** Lista de cartões.

### Criar Cartão
- **Endpoint:** `POST /credit-cards`
- **Descrição:** Adiciona um novo cartão de crédito.
- **Requisitos (Body):**
  - `name` (string): Nome do cartão.
  - `closingDay` (number): Dia de fechamento.
  - `dueDay` (number): Dia de vencimento.
  - `limit` (number): Limite.
  - `last4Digits` (string, opcional): Últimos 4 dígitos.
- **Retorno:** Objeto do cartão.

### Atualizar Cartão
- **Endpoint:** `PUT /credit-cards/:id`
- **Descrição:** Atualiza dados de um cartão.
- **Requisitos (Params):** `id` do cartão.
- **Requisitos (Body):** Mesmos campos de criação.
- **Retorno:** Objeto do cartão atualizado.

### Deletar Cartão
- **Endpoint:** `DELETE /credit-cards/:id`
- **Descrição:** Remove (soft delete) um cartão.
- **Requisitos (Params):** `id` do cartão.
- **Retorno:** Status de sucesso.

### Pagar Fatura
- **Endpoint:** `POST /credit-cards/:id/pay-invoice`
- **Descrição:** Registra o pagamento de uma fatura.
- **Requisitos (Params):** `id` do cartão.
- **Requisitos (Body):**
  - `amount` (number): Valor pago.
  - `date` (string): Data do pagamento.
- **Retorno:** Objeto do pagamento.

### Cancelar Pagamento de Fatura
- **Endpoint:** `DELETE /credit-cards/:id/invoice-payment`
- **Descrição:** Cancela um pagamento de fatura.
- **Requisitos (Params):** `id` do cartão.
- **Requisitos (Body/Query):**
  - `paymentId` (string, opcional): ID do pagamento a cancelar. Se não fornecido, tenta cancelar o último.
- **Retorno:** Status de sucesso.

### Listar Pagamentos de Fatura
- **Endpoint:** `GET /credit-cards/:id/invoice-payments`
- **Descrição:** Retorna histórico de pagamentos de fatura de um cartão.
- **Requisitos (Params):** `id` do cartão.
- **Retorno:** Lista de pagamentos.
