from typing import Any, List
from sklearn.model_selection import train_test_split, KFold, StratifiedKFold, LeaveOneOut

from .data import DataHandler
from .model import ModelHandler
from .strategies import Strategy, EarlyFusionStrategy, LateFusionStrategy, UnimodalStrategy

##########################################################################################

SUPPORTED_STRATEGIES = {
    "unimodal": {
        "description": "Unimodal",
        "class": UnimodalStrategy,
        "group": "Unimodal"
    },
    "early_fusion": {
        "description": "Early Fusion",
        "class": EarlyFusionStrategy,
        "group": "Fusion"
    },
    "late_fusion": {
        "description": "Late Fusion",
        "class": LateFusionStrategy,
        "group": "Fusion"
    }
}

##########################################################################################

SUPPORTED_VALIDATIONS = {
    "holdout": {
        "description": "Train-Test Split",
        "library": "sklearn",
        "function": train_test_split,
        "params": {
            "test_size": [0.1, 0.2, 0.3, 0.4, 0.5],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "shuffle": [True, False]
        }
    },
    "kfold": {
        "description": "K-Fold Cross Validation",
        "library": "sklearn",
        "function": KFold,
        "params": {
            "n_splits": [2, 3, 4, 5, 6, 7, 8, 9, 10],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "shuffle": [True, False]
        }
    },
    "stratified_kfold": {
        "description": "Stratified K-Fold Cross Validation",
        "library": "sklearn",
        "function": StratifiedKFold,
        "params": {
            "n_splits": [2, 3, 4, 5, 6, 7, 8, 9, 10],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "shuffle": [True, False]
        }
    },
    "leave_one_out": {
        "description": "Leave One Out Cross Validation",
        "library": "sklearn",
        "function": LeaveOneOut,
        "params": {}
    },
}

##########################################################################################


class StrategyHandler():
    """
    Handles the strategies used in the pipeline.

    Attributes:
    -----------
    strategies: dict
        A dictionary mapping strategy names to their corresponding Strategy objects.

    Methods:
    --------
    add_strategy(self, strategy: Strategy) -> None:
        Adds a new strategy to the handler.
    get_strategy(self, strategy_name: str) -> Strategy:
        Returns the Strategy object for the given strategy name.
    get_supported_strategies_information(self) -> List[dict]:
        Returns a list of dictionaries containing information about the supported strategies.
    """

    def __init__(self):
        self.strategies = {}

    def add_strategy(self, strategy_name: str, strategy_type: str, data_handler: DataHandler) -> None:
        """
        Adds a new strategy to the handler.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to add.
        strategy_type: str
            The type of the strategy to add.
        """
        strategy_info = SUPPORTED_STRATEGIES[strategy_type]
        strategy_class = strategy_info["class"]
        self.strategies[strategy_name] = strategy_class(strategy_name, strategy_type, data_handler)

    def remove_strategy(self, strategy_name: str) -> None:
        """
        Removes a strategy from the handler.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to remove.
        """
        del self.strategies[strategy_name]

    def add_model(self, strategy_name: str, model_name: str, model_type: str, model_parameters: dict = {}, model_input: str = None) -> None:
        """
        Adds a new model to the strategy.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to add the model to.
        model_name: str
            The name of the model to add.
        model_type: str
            The type of the model to add.
        model_parameters: dict, default={}
            The parameters of the model to add.
        model_input: str, default=None
            The name of the dataset to use as input for the model.
        """
        if model_input is None:
            self.strategies[strategy_name].add_model(model_name, model_type, model_parameters)
        else:
            self.strategies[strategy_name].add_model(model_name, model_type, model_parameters, model_input)


    def get_strategy(self, strategy_name: str) -> Strategy:
        """
        Returns the Strategy object for the given strategy name.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to return.

        Returns:
        --------
        The Strategy object.
        """
        return self.strategies[strategy_name]

    def train_strategy(self, run_name: str, strategy_name: str, validation_type: str, validation_parameters: dict = {}) -> None:
        """
        Trains the strategy.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to train.
        validation_type: str
            The type of validation to use.
        validation_parameters: dict, default={}
            The parameters of the validation to use.
        """
        return self.strategies[strategy_name].train(run_name, validation_type, validation_parameters)

    def get_strategy_graph(self, strategy_name: str) -> dict:
        """
        Returns the graph of the strategy.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to return the graph of.

        Returns:
        --------
        The graph of the strategy.
        """
        return self.strategies[strategy_name].get_graph()

    def get_supported_strategies_information(self) -> List[dict]:
        """
        Returns a list of dictionaries containing information about the supported strategies.

        Returns:
        --------
        A list of dictionaries containing information about the supported strategies.
        """
        return [
            {
                "name": strategy_name,
                "description": strategy_info["description"],
                "group": strategy_info["group"]
            }
            for strategy_name, strategy_info in SUPPORTED_STRATEGIES.items()
        ]

    def get_saved_strategies_information(self) -> List[dict]:
        """
        Returns a list of dictionaries containing information about the saved strategies.

        Returns:
        --------
        A list of dictionaries containing information about the saved strategies.
        """
        return [
            {
                "name": strategy_name,
                "type": strategy.type,
                "version": strategy.version,
            }
            for strategy_name, strategy in self.strategies.items()
        ]

    
    def get_supported_validations_information(self):
        """
        Get information about the supported validations.

        Returns:
        --------
        supported_validations_info: list
            A list of dictionaries containing information about the supported validations.
        """
        supported_validations_info = []

        for validation in SUPPORTED_VALIDATIONS:
            supported_validations_info.append({
                "id": validation,
                "description": SUPPORTED_VALIDATIONS[validation]["description"],
                "library": SUPPORTED_VALIDATIONS[validation]["library"],
                "params": SUPPORTED_VALIDATIONS[validation]["params"]
            })

        return supported_validations_info

    def get_supported_models_information(self, strategy_name: str) -> List[dict]:
        """
        Returns a list of dictionaries containing information about the supported models.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to get the supported models for.

        Returns:
        --------
        A list of dictionaries containing information about the supported models.
        """
        return self.strategies[strategy_name].model_handler.get_supported_models_information()

    def get_strategy_requirements(self, strategy_name: str) -> List[dict]:
        """
        Returns the requirements of the strategy.

        Parameters:
        -----------
        strategy_name: str
            The name of the strategy to get the requirements of.

        Returns:
        --------
        The requirements of the strategy.
        """
        return self.strategies[strategy_name].get_requirements()
