from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from models.dixon_coles import DixonColesModel
from models.monte_carlo import MonteCarloSimulator
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("math-service")

app = FastAPI(
    title="Football Analytics Pro - Math Service",
    description="Microserviço Python para cálculos de Poisson, Dixon-Coles e simulação de Monte Carlo.",
    version="1.0.0"
)

# Modelos Pydantic para validação de dados
class MatchRecord(BaseModel):
    home_team: str
    away_team: str
    home_goals: int
    away_goals: int
    date: str  # Formato ISO (ex: "2026-07-20T23:30:00Z")

class PredictionRequest(BaseModel):
    home_team: str
    away_team: str
    history: List[MatchRecord] = Field(default_factory=list)
    xi: Optional[float] = 0.003  # Fator de decaimento temporal para calibração

class PredictionResponse(BaseModel):
    home_team: str
    away_team: str
    probabilities: Dict[str, float]
    expected_goals: Dict[str, float]
    correct_scores: List[Dict[str, Any]]
    model_params: Optional[Dict[str, Any]] = None

@app.get("/")
def read_root():
    return {"status": "ok", "service": "Football Analytics Pro Math Service"}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    """
    Treina o modelo Dixon-Coles com o histórico fornecido (se houver) 
    e roda 10.000 simulações de Monte Carlo para prever a partida.
    """
    try:
        logger.info(f"Recebendo pedido de predição: {request.home_team} vs {request.away_team}")
        
        # 1. Obter todos os times únicos do histórico
        all_teams = set()
        for match in request.history:
            all_teams.add(match.home_team)
            all_teams.add(match.away_team)
            
        # Adicionar os times da partida atual se não estiverem no histórico
        all_teams.add(request.home_team)
        all_teams.add(request.away_team)
        
        # 2. Inicializar o modelo Dixon-Coles
        model = DixonColesModel(team_list=sorted(list(all_teams)))
        
        # 3. Treinar o modelo se houver histórico
        calibrated = False
        if request.history:
            logger.info(f"Calibrando Dixon-Coles com {len(request.history)} partidas...")
            history_data = [
                {
                    "home_team": m.home_team,
                    "away_team": m.away_team,
                    "home_goals": m.home_goals,
                    "away_goals": m.away_goals,
                    "date": m.date
                }
                for m in request.history
            ]
            calibrated = model.fit(history_data, xi=request.xi)
            logger.info(f"Calibração concluída. Sucesso: {calibrated}")
            
        # 4. Rodar simulações de Monte Carlo
        logger.info("Rodando simulações de Monte Carlo (10.000 iterações)...")
        simulator = MonteCarloSimulator(num_simulations=10000)
        results = simulator.simulate_match(request.home_team, request.away_team, model)
        
        # Preparar retorno das forças calculadas
        model_params = None
        if calibrated:
            # Pegar os alphas e betas específicos dos dois times
            home_idx = model.team_indices[request.home_team]
            away_idx = model.team_indices[request.away_team]
            model_params = {
                "home_attack": round(float(model.alpha[home_idx]), 4),
                "home_defense": round(float(model.beta[home_idx]), 4),
                "away_attack": round(float(model.alpha[away_idx]), 4),
                "away_defense": round(float(model.beta[away_idx]), 4),
                "home_advantage": round(float(model.gamma), 4),
                "rho_correlation": round(float(model.rho), 4)
            }
            
        return PredictionResponse(
            home_team=request.home_team,
            away_team=request.away_team,
            probabilities=results["probabilities"],
            expected_goals=results["expected_goals"],
            correct_scores=results["correct_scores"],
            model_params=model_params
        )
        
    except Exception as e:
        logger.error(f"Erro ao calcular predição: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
