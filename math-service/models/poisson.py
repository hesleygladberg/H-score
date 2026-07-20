import math
import numpy as np
from scipy.stats import poisson

class PoissonModel:
    @staticmethod
    def calculate_probability(goals: int, lam: float) -> float:
        """Calcula a probabilidade de marcar um número exato de gols dado o lambda."""
        if lam <= 0:
            return 1.0 if goals == 0 else 0.0
        return poisson.pmf(goals, lam)

    @staticmethod
    def get_goal_distribution(lam: float, max_goals: int = 10) -> np.ndarray:
        """Retorna a distribuição de probabilidade de gols de 0 até max_goals."""
        if lam <= 0:
            dist = np.zeros(max_goals + 1)
            dist[0] = 1.0
            return dist
        
        goals = np.arange(0, max_goals + 1)
        dist = poisson.pmf(goals, lam)
        
        # Normalizar para garantir que a soma das probabilidades seja 1
        total = np.sum(dist)
        if total > 0:
            dist = dist / total
            
        return dist
