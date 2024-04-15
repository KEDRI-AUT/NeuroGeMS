from abc import ABC, abstractmethod
from typing import Any

from ..strategies import StrategyHandler

class Experiment(ABC):
    """
    Base class for experiments.

    Attributes:
    -----------
    name: str
        The name of the experiment.

    Methods:
    --------
    run(self) -> Any:
        Runs the experiment.
    """

    def __init__(self, experiment_name: str, strategy_name: str, strategy_handler: StrategyHandler):
        self.name = experiment_name
        self.strategy = strategy_name
        self.strategy_handler = strategy_handler

    @abstractmethod
    def run(self) -> Any:
        """
        Runs the experiment.

        Returns:
        --------
        The results of the experiment.
        """
        pass