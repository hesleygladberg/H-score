# Football Analytics Pro — Plataforma de Análise de Futebol

O **Football Analytics Pro** é uma plataforma web privada de análise estatística de futebol projetada para identificar oportunidades de valor (+EV) e simular cenários em múltiplos mercados de apostas esportivas. O projeto é composto por três serviços principais integrados:

1. **math-service (Python / FastAPI)**: Microsserviço de modelagem matemática. Calcula e simula probabilidades de gols por distribuição de Poisson, modelo Dixon-Coles (com correção de empates e peso temporal) e roda 10.000 simulações de Monte Carlo por partida.
2. **backend (Node.js / NestJS)**: API REST que gerencia dados, integra com o banco de dados Supabase/PostgreSQL, calcula liquidações do Dutching e orquestra a comunicação com o serviço matemático.
3. **frontend (Next.js / TypeScript / Tailwind CSS)**: Interface de usuário de alta performance no tema escuro, com widgets dinâmicos de banca, gráficos Recharts e tabelas interativas.

---

## 🛠️ Tecnologias e Dependências

### Pré-requisitos
Certifique-se de que seu sistema possui:
- **Node.js** (v20 ou superior)
- **Python** (v3.11 ou v3.12)
- **Git**

---

## 🚀 Como Executar o Projeto Localmente

Siga o passo a passo abaixo para rodar os três serviços na sua máquina de desenvolvimento.

### Passo 1: Iniciar o Serviço Matemático (Python)
1. Navegue até o diretório `math-service`:
   ```bash
   cd math-service
   ```
2. Ative o ambiente virtual:
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```
3. Instale as dependências (caso não estejam instaladas):
   ```bash
   pip install -r requirements.txt
   ```
4. Inicie o servidor FastAPI via Uvicorn na porta `8000`:
   ```bash
   uvicorn app:app --reload --port 8000
   ```

### Passo 2: Iniciar o Backend (NestJS)
1. Abra um novo terminal e navegue até a pasta `backend`:
   ```bash
   cd backend
   ```
2. Instale as dependências do Node:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` com a sua URL do banco de dados (por padrão, o backend rodará em **Modo Fallback em Memória** caso não se conecte ao PostgreSQL real, permitindo que todas as telas funcionem instantaneamente sem banco físico).
4. Inicie o servidor NestJS na porta `3001`:
   ```bash
   npm run start:dev
   ```

### Passo 3: Iniciar o Frontend (Next.js)
1. Abra um terceiro terminal e navegue até a pasta `frontend`:
   ```bash
   cd frontend
   ```
2. Instale as dependências do Node:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Next.js na porta `3000`:
   ```bash
   npm run dev
   ```
4. Abra o seu navegador no endereço: [http://localhost:3000](http://localhost:3000)

---

## 📈 Funcionalidades Disponíveis na Interface

- **Dashboard**: Visão geral de jogos do dia, status de banca (Saldo, Lucros, ROI), monitor rápido do scanner e links para as rodadas.
- **Jogos do Dia**: Lista de confrontos diários, com as probabilidades 1X2 calculadas em tempo real pelo modelo matemático, indicação de melhor mercado e indicação clara de porcentagem de EV.
- **Análise Detalhada (Por Jogo)**:
  - **Aba Visão Geral**: Probabilidades reais vs odds de mercado com cotação justa teórica.
  - **Aba Over/Under**: Análise probabilística e cálculo de EV das linhas de gols Over 0.5, 1.5, 2.5 e Under 2.5.
  - **Aba Ambas Marcam (BTTS)**: Probabilidade de BTTS Sim e Não com respectivos EVs.
  - **Aba Correct Score**: Tabela com os 20 placares mais prováveis com ordenação automática (maior prob. para menor) e cotações.
  - **Aba Dutching**: Calculadora interativa de Dutching. Selecione múltiplos placares, informe a stake total e veja a stake individual ser distribuída automaticamente garantindo o mesmo lucro exato, além de calcular o ROI total e a cobertura real.
  - **Aba Escalações**: Formações táticas e listas de titulares, lesionados e suspensos.
  - **Aba Estatísticas**: Comparativo visual de gols marcados, xG (gols esperados), posse de bola média e chutes.
  - **Aba H2H**: Histórico de confrontos diretos recentes.
- **Scanner EV+**: Radar que vasculha todos os mercados para encontrar value bets que atendam aos seus filtros mínimos de EV e probabilidade.
- **Gestão de Banca**: Histórico de apostas diárias e gráfico de evolução patrimonial dinâmico integrado via Recharts.

---

## 🧪 Modelagem Matemática Utilizada

- **Modelo Poisson Independente**: Determina a taxa esperada de gols de cada equipe (lambda/mu) a partir das forças de ataque/defesa.
- **Modelo Dixon-Coles**: Ajusta a distribuição de gols para compensar as dependências reais entre os gols de mandante e visitante, corrigindo as distorções em empates e partidas com poucos gols.
- **Peso Temporal**: Na calibração do modelo, os confrontos recebem um decaimento temporal $\exp(-\xi \times t)$ para dar maior peso e importância para partidas jogadas recentemente.
- **Monte Carlo**: O sistema roda 10.000 iterações por jogo simulando placares hipotéticos para aproximar as probabilidades empíricas ideais de cada mercado.
