# App de Gestão Financeira Inteligente 💰

## Visão Geral

App mobile React Native/Expo de gestão financeira inteligente que permite cadastrar gastos, definir orçamentos por categoria, criar metas financeiras e visualizar projeções e insights sobre seus gastos.

## 📱 Stack Tecnológica

### Frontend Mobile
- **React Native** com **Expo** (TypeScript)
- **React Navigation** - Navegação (Stack + Bottom Tabs)
- **React Native Paper** - Componentes UI Material Design
- **Zustand** - Gerenciamento de estado global
- **React Hook Form + Zod** - Formulários e validação

### Persistência
- **Expo SQLite** - Banco de dados local
- Arquitetura preparada para sincronização em nuvem futura

### Animações e Gestos
- **React Native Reanimated** - Animações fluidas
- **React Native Gesture Handler** - Gestos nativos

## 🎯 Funcionalidades MVP

### ✅ Implementadas
1. **Cadastro Inteligente de Gastos**
   - Categorização (alimentação, transporte, saúde, lazer, etc.)
   - Método de pagamento (dinheiro, crédito, débito, PIX)
   - Gastos recorrentes
   - Validação com Zod

2. **Orçamentos Mensais por Categoria**
   - Definição de limites por categoria
   - Cálculo automático de consumo
   - Barras de progresso animadas com indicadores visuais (verde/amarelo/vermelho)
   - Porcentagem de uso em tempo real

3. **Dashboard Financeiro**
   - Total gasto no mês
   - Projeção de gastos futuros baseada em histórico
   - Breakdown por categoria com porcentagens
   - Saldo disponível

4. **Metas Financeiras**
   - Criar metas de economia ou limite de gastos
   - Progress bars animadas
   - Cálculo de ETA (tempo estimado para alcançar meta)
   - Avaliação em tempo real contra gastos

5. **Timeline Financeira**
   - Lista cronológica de todos os gastos
   - Filtros visuais por categoria
   - Swipe actions para deletar
   - Visualização detalhada

6. **Alertas Visuais Inteligentes**
   - Cards/banners de alerta no dashboard
   - Notificações ao atingir 80% do orçamento
   - Alertas ao ultrapassar limites
   - Estrutura preparada para push notifications futuras

## 📂 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Card.tsx
│   ├── ProgressBar.tsx
│   └── AlertBanner.tsx
├── constants/           # Constantes e configurações
│   └── index.ts        # Categorias, métodos de pagamento, cores
├── hooks/              # Custom hooks
│   └── useFinanceEngine.ts  # Cálculos financeiros automáticos
├── navigation/         # Configuração de navegação
│   └── AppNavigator.tsx
├── screens/            # Telas do app
│   ├── DashboardScreen.tsx
│   ├── AddExpenseScreen.tsx
│   ├── BudgetsScreen.tsx
│   ├── GoalsScreen.tsx
│   └── TimelineScreen.tsx
├── services/           # Serviços e APIs
│   └── database.ts     # Camada de persistência SQLite
├── store/              # Estado global Zustand
│   └── financeStore.ts
├── theme/              # Design system
│   └── index.ts        # Cores, tipografia, espaçamento, sombras
├── types/              # TypeScript types
│   └── index.ts
└── utils/              # Utilitários
    └── seedData.ts     # Dados de exemplo
```

## 🗄️ Banco de Dados (SQLite)

### Tabelas
- **expenses** - Gastos registrados
- **budgets** - Orçamentos por categoria
- **goals** - Metas financeiras
- **alerts** - Alertas e notificações

### Índices
- `idx_expenses_date` - Busca por data
- `idx_expenses_category` - Busca por categoria
- `idx_budgets_month` - Busca por mês

## 🎨 Design System

### Paleta de Cores
- **Primary**: #6366F1 (Índigo)
- **Secondary**: #8B5CF6 (Roxo)
- **Success**: #10B981 (Verde)
- **Warning**: #F59E0B (Laranja)
- **Danger**: #EF4444 (Vermelho)

### Categorias com Cores
- Alimentação: #F59E0B
- Transporte: #3B82F6
- Saúde: #EF4444
- Lazer: #8B5CF6
- Compras: #EC4899
- Contas: #6366F1
- Educação: #14B8A6
- Outros: #6B7280

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o servidor Expo**:
   ```bash
   npm start
   ```

3. **Visualizar o app**:
   - Escaneie o QR code com o app **Expo Go** (Android/iOS)
   - Ou pressione `w` para abrir no navegador web
   - Ou pressione `a` para Android emulator
   - Ou pressione `i` para iOS simulator (apenas macOS)

## 🔮 Próximas Fases

### Fase 2 - Funcionalidades Avançadas
- [ ] OCR para captura de recibos com câmera
- [ ] Notificações push inteligentes
- [ ] Sincronização em nuvem (Firebase/Supabase)
- [ ] Backup automático
- [ ] Modo offline/online

### Fase 3 - IA e Automação
- [ ] Modo econômico com sugestões de cortes
- [ ] IA generativa para análise de gastos
- [ ] Integração com calendário (Google/iOS)
- [ ] Relatórios mensais automatizados com PDF
- [ ] Comparação com média de outros usuários

## 📝 Notas Técnicas

### Arquitetura de Estado
- **Zustand store** centraliza todo o estado da aplicação
- **useFinanceEngine hook** provê cálculos derivados e insights
- Separação clara entre lógica de negócio e UI

### Performance
- FlatList otimizada para timeline de gastos
- Animações com Reanimated para 60fps
- Memoization de cálculos caros
- Índices de banco de dados para queries rápidas

### Boas Práticas Mobile
- Design system consistente
- Feedback tátil em interações
- Gestos nativos (swipe, pull-to-refresh)
- Animações fluidas e responsivas
- Tratamento de estados de loading e erro

## 🎯 Fluxo Principal do Usuário

1. **Adicionar Gasto**: Toque no FAB → Selecione categoria → Digite valor → Confirme
2. **Ver Gastos**: Vá para Timeline → Veja lista cronológica → Swipe para deletar
3. **Definir Orçamento**: Vá para Orçamentos → Selecione categoria → Defina limite
4. **Criar Meta**: Vá para Metas → Defina título e valor alvo → Acompanhe progresso
5. **Dashboard**: Veja resumo, projeções e alertas em tempo real

## 📊 Dados de Demonstração

O app vem com dados de exemplo pré-carregados:
- 4 gastos de exemplo em diferentes categorias
- 3 orçamentos configurados
- 1 meta de economia (Viagem de Férias)

---

**Data de Criação**: 12 de Outubro de 2025
**Versão**: 1.0.0
**Autor**: Desenvolvido com React Native + Expo
