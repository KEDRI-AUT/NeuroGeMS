from hyperopt import fmin, tpe, hp, STATUS_OK, Trials
import mlflow

from ..strategies import StrategyHandler
from .base import Experiment

class ParameterOptimisation(Experiment):
    """
    A class for implementing parameter optimisation experiments.
    This experiment requires one strategy and one metric. The strategy is used
    to train the model and the metric is used to evaluate the model.
    
    Parameters:
    -----------
    name : str
        Name of the experiment
    strategy_handler : StrategyHandler
        Object for managing the list of strategies used in the experiment
    metric_handler : MetricHandler
        Object for managing the list of metrics used in the experiment

    Attributes:
    -----------
    name : str
        Name of the experiment
    strategy_handler : StrategyHandler
        Object for managing the list of strategies used in the experiment

    Methods:
    --------
    get_required_strategies() -> List[str]:
        Returns a list of strategies required by the experiment

    get_required_metrics() -> List[str]:    
        Returns a list of metrics required by the experiment

    run() -> None:
        Runs the experiment

    Example:
    --------
    # create an experiment object with a strategy and a metric
    strategy_handler = StrategyHandler()
    parameter_optimisation = ParameterOptimisation("parameter_optimisation", strategy_handler)
    strategy_handler.add_strategy("strategy_1", strategy_1)
    parameter_optimisation.run()
    """

    def __init__(self, experiment_name: str, strategy_name: str, strategy_handler: StrategyHandler):
        super().__init__(experiment_name, strategy_name, strategy_handler)

    def _train_model(self, params):
            
            # Cross-validation
        #     cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=random_state)
        #     y_pred = cross_val_predict(model, X_train, y_train, cv=cv)
        #     calulate_and_log_metrics(y_train, y_pred)
        #     loss = -matthews_corrcoef(y_train, y_pred) * roc_auc_score(y_train, y_pred)
            
        # If val set is defined use:
        model.fit(X_train, y_train)
        y_pred = model.predict(X_val)
        calulate_and_log_metrics(y_val, y_pred)
        loss = -matthews_corrcoef(y_val, y_pred) * roc_auc_score(y_val, y_pred)
        
        return {'loss': loss, 'status': STATUS_OK}

    def run(self, run_params):
        """
        """
        search_space = run_params["search_space"]
        max_evals = run_params["max_evals"]
        with mlflow.start_run(run_name=self.name):
            best_result = fmin(
                fn=self._train_model,
                space=search_space,
                algo=tpe.suggest,
                max_evals=max_evals,
                trials=Trials(),
            )
        return best_result