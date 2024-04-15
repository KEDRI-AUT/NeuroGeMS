import mlflow

from ..strategies import StrategyHandler
from .base import Experiment

class TrainModel(Experiment):
    """
    A class for training a model.
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

    def run(self, run_params: dict) -> None:
        """
        Runs the experiment.
        """
        with mlflow.start_run(run_name=self.name):
            self.strategy_handler.run_strategy(self.strategy)