import numpy as np
from scipy.optimize import minimize
from scipy.stats import poisson
import datetime

class DixonColesModel:
    def __init__(self, team_list=None):
        self.teams = team_list if team_list else []
        self.team_indices = {team: i for i, team in enumerate(self.teams)}
        self.num_teams = len(self.teams)
        
        # Parâmetros padrão
        self.alpha = np.ones(self.num_teams)  # Força de ataque
        self.beta = np.ones(self.num_teams)   # Força de defesa (valores menores = melhor defesa)
        self.gamma = 1.3                      # Vantagem de jogar em casa (Home Advantage)
        self.rho = -0.1                       # Parâmetro de correção de empates (geralmente negativo no ajuste)

    def _tau(self, x, y, lam, mu, rho):
        """Função de ajuste Dixon-Coles para corrigir empates e placares baixos."""
        if x == 0 and y == 0:
            return 1.0 - lam * mu * rho
        elif x == 0 and y == 1:
            return 1.0 + lam * rho
        elif x == 1 and y == 0:
            return 1.0 + mu * rho
        elif x == 1 and y == 1:
            return 1.0 - rho
        else:
            return 1.0

    def get_lambdas(self, home_team, away_team, alpha=None, beta=None, gamma=None):
        """Retorna os valores esperados de gols (lambda para mandante, mu para visitante)."""
        if alpha is None: alpha = self.alpha
        if beta is None: beta = self.beta
        if gamma is None: gamma = self.gamma
        
        home_idx = self.team_indices.get(home_team)
        away_idx = self.team_indices.get(away_team)
        
        # Fallback se o time for novo ou não estiver mapeado
        if home_idx is None or away_idx is None:
            return 1.3, 1.0  # Médias padrão aproximadas
            
        lam = alpha[home_idx] * beta[away_idx] * gamma
        mu = alpha[away_idx] * beta[home_idx]
        
        # Evitar lambdas zerados ou negativos que quebram o Poisson
        return max(lam, 0.001), max(mu, 0.001)

    def calculate_joint_probability(self, home_goals, away_goals, home_team, away_team):
        """Calcula a probabilidade conjunta ajustada pelo Dixon-Coles."""
        lam, mu = self.get_lambdas(home_team, away_team)
        
        prob_home = poisson.pmf(home_goals, lam)
        prob_away = poisson.pmf(away_goals, mu)
        
        adj = self._tau(home_goals, away_goals, lam, mu, self.rho)
        
        # Retorna probabilidade ajustada (garantindo que não seja negativa)
        return max(prob_home * prob_away * adj, 0.0)

    def fit(self, matches, xi=0.003):
        """
        Ajusta os parâmetros alpha, beta, gamma e rho usando máxima verossimilhança.
        matches: Lista de dicionários contendo {'home_team', 'away_team', 'home_goals', 'away_goals', 'date'}
        xi: Fator de decaimento temporal por dia (default 0.003, que dá peso menor para jogos antigos)
        """
        if not matches:
            return
            
        # Extrair todos os times únicos se não fornecidos
        all_teams = set()
        for m in matches:
            all_teams.add(m['home_team'])
            all_teams.add(m['away_team'])
        
        self.teams = sorted(list(all_teams))
        self.team_indices = {team: i for i, team in enumerate(self.teams)}
        self.num_teams = len(self.teams)
        
        # Data de referência para cálculo do peso temporal (último jogo na base)
        dates = []
        for m in matches:
            if isinstance(m['date'], str):
                d = datetime.datetime.fromisoformat(m['date'].replace('Z', '+00:00'))
            else:
                d = m['date']
            dates.append(d)
        
        ref_date = max(dates) if dates else datetime.datetime.now(datetime.timezone.utc)
        
        # Preparar dados para o otimizador
        home_indices = []
        away_indices = []
        home_goals_list = []
        away_goals_list = []
        weights = []
        
        for m in matches:
            h_idx = self.team_indices[m['home_team']]
            a_idx = self.team_indices[m['away_team']]
            
            if isinstance(m['date'], str):
                d = datetime.datetime.fromisoformat(m['date'].replace('Z', '+00:00'))
            else:
                d = m['date']
                
            days_diff = (ref_date - d).days
            weight = np.exp(-xi * days_diff)
            
            home_indices.append(h_idx)
            away_indices.append(a_idx)
            home_goals_list.append(m['home_goals'])
            away_goals_list.append(m['away_goals'])
            weights.append(weight)
            
        home_indices = np.array(home_indices)
        away_indices = np.array(away_indices)
        home_goals_list = np.array(home_goals_list)
        away_goals_list = np.array(away_goals_list)
        weights = np.array(weights)

        # Função de perda (Negative Log-Likelihood)
        def loss_function(params):
            alpha_params = params[:self.num_teams]
            beta_params = params[self.num_teams:2*self.num_teams]
            gamma_param = params[2*self.num_teams]
            rho_param = params[2*self.num_teams + 1]
            
            # Restrição Dixon-Coles: Média de alpha deve ser igual a 1
            # Nós adicionamos uma penalidade para impor isso suavemente
            mean_alpha_penalty = 10000.0 * (np.mean(alpha_params) - 1.0)**2
            
            # Calcular lambdas e mus para todos os jogos
            lams = alpha_params[home_indices] * beta_params[away_indices] * gamma_param
            mus = alpha_params[away_indices] * beta_params[home_indices]
            
            # Impedir valores negativos ou muito pequenos
            lams = np.clip(lams, 0.001, None)
            mus = np.clip(mus, 0.001, None)
            
            # Probabilidades de Poisson independentes
            log_prob_home = home_goals_list * np.log(lams) - lams
            log_prob_away = away_goals_list * np.log(mus) - mus
            
            # Ajuste de Dixon-Coles
            adj_factors = np.ones(len(home_goals_list))
            
            # 0-0
            idx_0_0 = (home_goals_list == 0) & (away_goals_list == 0)
            adj_factors[idx_0_0] = 1.0 - lams[idx_0_0] * mus[idx_0_0] * rho_param
            
            # 0-1
            idx_0_1 = (home_goals_list == 0) & (away_goals_list == 1)
            adj_factors[idx_0_1] = 1.0 + lams[idx_0_1] * rho_param
            
            # 1-0
            idx_1_0 = (home_goals_list == 1) & (away_goals_list == 0)
            adj_factors[idx_1_0] = 1.0 + mus[idx_1_0] * rho_param
            
            # 1-1
            idx_1_1 = (home_goals_list == 1) & (away_goals_list == 1)
            adj_factors[idx_1_1] = 1.0 - rho_param
            
            # Tratar possíveis fatores de ajuste negativos adicionando uma penalidade
            adj_factors = np.clip(adj_factors, 1e-5, None)
            
            log_adj = np.log(adj_factors)
            
            # Log-verossimilhança ponderada pelo decaimento temporal
            log_likelihood = np.sum(weights * (log_prob_home + log_prob_away + log_adj))
            
            return -log_likelihood + mean_alpha_penalty

        # Chutes iniciais (Alphas = 1.0, Betas = 1.0, Gamma = 1.3, Rho = -0.1)
        initial_params = np.concatenate([
            np.ones(self.num_teams),  # alphas
            np.ones(self.num_teams),  # betas
            [1.3],                    # gamma
            [-0.1]                    # rho
        ])
        
        # Limites para parâmetros (alphas e betas devem ser positivos, rho deve estar entre limites)
        bounds = []
        for _ in range(2 * self.num_teams):
            bounds.append((0.05, 5.0))  # limites para força de ataque/defesa
        bounds.append((0.5, 3.0))       # limite para vantagem de casa
        bounds.append((-1.0, 1.0))      # limite para rho (parâmetro de correlação)
        
        # Otimização por L-BFGS-B
        res = minimize(loss_function, initial_params, method='L-BFGS-B', bounds=bounds)
        
        if res.success:
            self.alpha = res.x[:self.num_teams]
            self.beta = res.x[self.num_teams:2*self.num_teams]
            self.gamma = res.x[2*self.num_teams]
            self.rho = res.x[2*self.num_teams + 1]
            
            # Garantir que a média de alpha seja exatamente 1 (renormalização)
            mean_alpha = np.mean(self.alpha)
            self.alpha = self.alpha / mean_alpha
            self.beta = self.beta * mean_alpha  # Renormalizar o beta para compensar
            
            return True
        return False
