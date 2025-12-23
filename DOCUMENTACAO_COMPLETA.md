# Documentação Completa do Projeto FinanceMobile

## 1. Visão Geral
O **FinanceMobile** é uma aplicação completa para gestão financeira pessoal, desenvolvida para plataformas móveis (Android/iOS) usando React Native e Expo, com um backend robusto em Node.js e banco de dados PostgreSQL. O sistema permite que o usuário gerencie despesas, receitas, orçamentos, metas financeiras e cartões de crédito, oferecendo uma visão clara da saúde financeira através de dashboards e relatórios.

## 2. Objetivos
- **Gestão Financeira Centralizada:** Permitir o registro e acompanhamento de todas as movimentações financeiras em um único lugar.
- **Controle de Orçamento:** Ajudar o usuário a definir limites de gastos por categoria e alertá-lo quando estiver próximo de excedê-los.
- **Planejamento de Metas:** Facilitar a criação e acompanhamento de metas financeiras (ex: economizar para viagem), com alocação de receitas específicas.
- **Gestão de Cartões de Crédito:** Controlar faturas, dias de fechamento/vencimento e pagamentos.

## 3. Arquitetura e Tecnologias

### Frontend (Mobile)
- **Framework:** React Native com Expo SDK 54.
- **Linguagem:** TypeScript.
- **UI/UX:** React Native Paper (Material Design 3), React Native SVG (Gráficos), React Native Reanimated (Animações).
- **Gerenciamento de Estado:** Zustand (para estado global leve e reativo).
- **Navegação:** React Navigation (Stack e Bottom Tabs).
- **Armazenamento Local (Opcional/Híbrido):** Suporte a SQLite (Nativo) e localforage (Web), embora a aplicação foque na sincronização com o backend.

### Backend (API)
- **Runtime:** Node.js.
- **Framework:** Express.
- **Linguagem:** TypeScript.
- **ORM:** Prisma.
- **Banco de Dados:** PostgreSQL.
- **Autenticação:** JWT (JSON Web Tokens).

## 4. Funcionalidades Detalhadas

### 4.1. Dashboard (Início)
A tela principal oferece um resumo imediato:
- **Resumo Financeiro:** Saldo disponível, Patrimônio Líquido (considerando dívidas), Receitas e Despesas do mês.
- **Gráficos:** Visualização de gastos por categoria.
- **Progresso de Orçamentos:** Barras de progresso mostrando o quanto do orçamento de cada categoria já foi consumido.
- **Alertas:** Banners para avisos importantes (ex: orçamento estourado).

### 4.2. Timeline (Extrato)
Histórico completo de transações:
- **Filtros:** Por período (Mês atual, últimos 3/6 meses, ano, tudo) e tipo (Receita/Despesa).
- **Edição/Exclusão:** Permite alterar ou remover transações existentes.
- **Detalhes:** Mostra categoria, valor, data e descrição.

### 4.3. Orçamentos (Budgets)
- **Definição de Limites:** O usuário define quanto quer gastar por categoria (ex: R$ 500,00 em Alimentação).
- **Recorrência:** Orçamentos podem ser recorrentes, copiados automaticamente mês a mês.
- **Monitoramento:** Cálculo automático de porcentagem gasta.
    - **Seguro:** < 80%
    - **Alerta:** >= 80%
    - **Excedido:** >= 100%

### 4.4. Metas (Goals)
- **Tipos de Meta:** Economia (Save) ou Limite de Gastos (Spend Limit).
- **Alocação de Receitas:** Ao cadastrar uma receita, é possível destinar uma parte dela diretamente para uma meta.
- **Barra de Progresso:** Visualização de quanto falta para atingir o valor alvo.
- **Datas Alvo:** Definição de prazo para conclusão da meta.

### 4.5. Cartões de Crédito
- **Cadastro:** Nome, dia de fechamento, dia de vencimento, limite e últimos 4 dígitos.
- **Gestão de Fatura:** Lançamento de despesas vinculadas a um cartão.
- **Pagamento:** Registro de pagamentos de fatura, que abatem o saldo devedor e impactam o saldo disponível.

### 4.6. Alertas
- Sistema inteligente que gera notificações internas para:
    - Orçamento próximo do limite (Warning).
    - Orçamento estourado (Exceeded).
    - Progresso de metas.
    - Gastos incomuns (potencial futuro).

### 4.7. Integrações (WhatsApp)
- Funcionalidade para vincular um número de WhatsApp.
- Login via WhatsApp (token/link).
- Geração de chaves de API para integrações externas.

## 5. Modelo de Dados (Schema Prisma)

O banco de dados é relacional, centrado no `User`.

- **User:** `id`, `email`, `password`, `name`, `themePreference` (light/dark), `whatsappNumber`.
- **Expense:** Gasto financeiro.
    - Campos: `value`, `category`, `date`, `paymentMethod`, `isRecurring`, `creditCardId` (opcional).
    - Relação: Pertence a um `User`. Pode pertencer a um `CreditCard`.
- **Income:** Receita financeira.
    - Campos: `value`, `category`, `date`, `isRecurring`.
    - Relação: Pertence a um `User`. Pode ter várias `GoalAllocation`.
- **Budget:** Orçamento mensal.
    - Campos: `limitAmount`, `category`, `month` (YYYY-MM), `isRecurring`.
    - Lógica: Um orçamento é único por Usuário + Categoria + Mês.
- **Goal:** Meta financeira.
    - Campos: `targetAmount`, `currentAmount`, `targetDate`, `type`.
    - Relação: Recebe alocações de `Income`.
- **GoalAllocation:** Tabela pivô que liga `Income` a `Goal`, registrando quanto de uma receita foi para uma meta.
- **Alert:** Notificações do sistema.
    - Campos: `type`, `message`, `isRead`.
- **CreditCard:** Cartão de crédito.
    - Campos: `closingDay`, `dueDay`, `limit`.
- **InvoicePayment:** Pagamento de fatura de cartão.
    - Campos: `amount`, `date`.

## 6. API e Rotas (Backend)

Base URL (Local): `http://localhost:3006`

### Autenticação
- `POST /auth/register`: Criar conta.
- `POST /auth/login`: Entrar.
- `GET /auth/me`: Dados do usuário logado.
- `PUT /users/preferences`: Atualizar tema.

### Despesas (Expenses)
- `GET /expenses`: Listar (filtros: data, cartão).
- `POST /expenses`: Criar.
- `PUT /expenses/:id`: Editar.
- `DELETE /expenses/:id`: Remover.

### Receitas (Incomes)
- `GET /incomes`: Listar.
- `POST /incomes`: Criar (suporta alocação em metas no body).
- `PUT /incomes/:id`: Editar.
- `DELETE /incomes/:id`: Remover.

### Orçamentos (Budgets)
- `GET /budgets?month=YYYY-MM`: Listar orçamentos de um mês. (Cria cópias de recorrentes automaticamente se não existirem).
- `POST /budgets`: Criar ou Atualizar se já existir.
- `PUT /budgets/:id`: Editar por ID.
- `DELETE /budgets/:id`: Remover.

### Metas (Goals)
- `GET /goals`: Listar.
- `POST /goals`: Criar.
- `PUT /goals/:id`: Editar.
- `DELETE /goals/:id`: Remover.

### Cartões de Crédito
- `GET /credit-cards`: Listar ativos.
- `POST /credit-cards`: Criar.
- `PUT /credit-cards/:id`: Editar.
- `DELETE /credit-cards/:id`: Remover (Soft Delete).
- `POST /credit-cards/:id/pay-invoice`: Pagar fatura.
- `DELETE /credit-cards/:id/invoice-payment`: Cancelar pagamento.

### Alertas
- `GET /alerts`: Listar.
- `PUT /alerts/:id/read`: Marcar como lido.

### Resumo Financeiro
- `GET /finance/summary`: Retorna saldos calculados.
    - `availableBalance` = Receitas (Mês) - Despesas Débito (Total*) - Pagamentos Fatura (Mês).
    - `netWorth` = Saldo Disponível - (Gastos Cartão - Pagamentos Fatura).

## 7. Fluxos de Interação do Sistema

1.  **Inicialização:**
    - App abre -> Verifica Token -> Se válido, carrega tema e vai para Dashboard.
    - Dashboard chama `useFinanceStore.initialize()`.
    - Store busca em paralelo: `/finance/summary`, `/expenses` (mês atual), `/budgets`, `/goals`, `/alerts`.

2.  **Adicionar Transação (Ex: Receita com Meta):**
    - Usuário preenche form no App (Valor: 1000, Meta Viagem: 200).
    - App envia `POST /incomes` com `goalAllocations`.
    - Backend cria Receita e alocações transacionalmente.

3.  **Cálculo de Orçamento:**
    - A cada nova despesa (`POST /expenses`), a Store local recalcula o total gasto da categoria.
    - Compara com o `limitAmount` do orçamento carregado.
    - Se passar de 80%, dispara função `checkBudgetAlerts` localmente (ou backend gera alerta) e exibe banner.

## 8. Guia de Desenvolvimento

### Instalação
1.  **Backend:**
    ```bash
    cd backend
    npm install
    # Configurar .env com DATABASE_URL e JWT_SECRET
    npx prisma migrate dev # Criar tabelas
    npm run dev
    ```

2.  **Frontend:**
    ```bash
    cd ..
    npm install
    npx expo start
    ```
    - Use `android` para emulador ou `scan` QR code com Expo Go.

### Estrutura de Pastas Chave
- `src/stores/financeStore.ts`: O "cérebro" do frontend. Gerencia todo o estado financeiro e sincronia.
- `src/screens/*`: Telas da aplicação.
- `src/components/*`: Componentes reutilizáveis (Cards, Gráficos).
- `backend/src/index.ts`: Ponto de entrada da API.
- `backend/prisma/schema.prisma`: Definição do banco.

---
*Documentação gerada automaticamente baseada na análise do código fonte em 22/12/2025.*
