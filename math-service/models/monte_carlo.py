import numpy as np
from collections import Counter
from typing import Dict, Any, List

class MonteCarloSimulator:
    def __init__(self, num_simulations: int = 10000, max_goals: int = 10):
        self.num_simulations = num_simulations
        self.max_goals = max_goals

    def simulate_match(self, home_team: str, away_team: str, model) -> Dict[str, Any]:
        """
        Executa 10.000 simulações para a partida e gera todas as estatísticas de probabilidade.
        """
        # 1. Calcular a matriz de probabilidade conjunta de placares
        goals = np.arange(0, self.max_goals + 1)
        matrix = np.zeros((self.max_goals + 1, self.max_goals + 1))
        
        for h in goals:
            for a in goals:
                matrix[h, a] = model.calculate_joint_probability(h, a, home_team, away_team)
                
        # Normalizar a matriz para que a soma seja exatamente 1.0
        total_prob = np.sum(matrix)
        if total_prob > 0:
            matrix = matrix / total_prob
        else:
            # Fallback em caso de falha nos lambdas
            matrix[1, 1] = 1.0
            
        # 2. Achatar a matriz para fazer sorteio multinomial (Simulações de Monte Carlo)
        flat_probs = matrix.flatten()
        
        # Mapear índice achatado de volta para (home_goals, away_goals)
        scores = []
        for h in goals:
            for a in goals:
                scores.append((h, a))
                
        # Executar 10.000 simulações (escolher 10.000 placares com base nas probabilidades)
        rng = np.random.default_rng()
        simulated_indices = rng.choice(len(scores), size=self.num_simulations, p=flat_probs)
        simulated_scores = [scores[idx] for idx in simulated_indices]
        
        # 3. Analisar as simulações para extrair as probabilidades de cada mercado
        num_sims = float(self.num_simulations)
        
        # 1X2
        home_wins = sum(1 for h, a in simulated_scores if h > a)
        draws = sum(1 for h, a in simulated_scores if h == a)
        away_wins = sum(1 for h, a in simulated_scores if h < a)
        
        p_home_win = home_wins / num_sims
        p_draw = draws / num_sims
        p_away_win = away_wins / num_sims
        
        # Over / Under
        totals = [h + a for h, a in simulated_scores]
        p_over_05 = sum(1 for t in totals if t > 0.5) / num_sims
        p_over_15 = sum(1 for t in totals if t > 1.5) / num_sims
        p_over_25 = sum(1 for t in totals if t > 2.5) / num_sims
        p_over_35 = sum(1 for t in totals if t > 3.5) / num_sims
        p_under_25 = sum(1 for t in totals if t < 2.5) / num_sims
        p_under_35 = sum(1 for t in totals if t < 3.5) / num_sims
        
        # BTTS (Ambas Marcam)
        btts_yes_count = sum(1 for h, a in simulated_scores if h > 0 and a > 0)
        p_btts_yes = btts_yes_count / num_sims
        p_btts_no = 1.0 - p_btts_yes
        
        # Correct Scores (Contagem e probabilidades dos top 20 placares mais frequentes nas simulações)
        score_counts = Counter(simulated_scores)
        top_scores: List[Dict[str, Any]] = []
        
        for score, count in score_counts.most_common(20):
            prob = count / num_sims
            score_str = f"{score[0]}x{score[1]}"
            # Evitar divisão por zero na odd justa
            fair_odd = round(1.0 / prob, 2) if prob > 0 else 999.0
            
            top_scores.append({
                "score": score_str,
                "probability": round(prob, 4),
                "fair_odd": fair_odd
            })
            
        # Obter os gols esperados das simulações (Média)
        expected_home_goals = np.mean([h for h, _ in simulated_scores])
        expected_away_goals = np.mean([a for _, a in simulated_scores])
        
        return {
            "probabilities": {
                "home_win": round(p_home_win, 4),
                "draw": round(p_draw, 4),
                "away_win": round(p_away_win, 4),
                "over_05": round(p_over_05, 4),
                "over_15": round(p_over_15, 4),
                "over_25": round(p_over_25, 4),
                "over_35": round(p_over_35, 4),
                "under_25": round(p_under_25, 4),
                "under_35": round(p_under_35, 4),
                "btts_yes": round(p_btts_yes, 4),
                "btts_no": round(p_btts_no, 4),
            },
            "expected_goals": {
                "home": round(float(expected_home_goals), 2),
                "away": round(float(expected_away_goals), 2)
            },
            "correct_scores": top_scores
        }
