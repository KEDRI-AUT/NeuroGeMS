from typing import List
import numpy as np
import mlflow
import shap
from itertools import permutations

from ..data import DataHandler
from .base import Strategy


class LateFusionStrategy(Strategy):
    """
    A class for implementing late fusion learning strategy.
    This strategy requires one model for every dataset. The data from each
    dataset is passed to the respective model for training. The predictions from
    each model are combined to form a single prediction.

    Parameters:
    -----------
    name : str
        Name of the strategy
    model_handler : ModelHandler
        Object for managing the list of models used in the strategy
    data_handler : DataHandler
        Object for managing the list of datasets used in the strategy

    Attributes:
    -----------
    name : str
        Name of the strategy
    model_handler : ModelHandler
        Object for managing the list of models used in the strategy
    data_handler : DataHandler
        Object for managing the list of datasets used in the strategy

    Methods:
    --------
    get_required_models() -> List[str]:
        Returns a list of models required by the strategy
    get_required_datasets() -> List[str]:
        Returns a list of datasets required by the strategy
    train() -> None:
        Trains the model using the data from the dataset
    predict(X: np.ndarray) -> np.ndarray:
        Predicts the output using the trained model

    Example:
    --------
    # create a strategy object with a model and a dataset
    model_handler = ModelHandler()
    data_handler = DataHandler()
    late_fusion = LateFusion("late_fusion", model_handler, data_handler)
    model_handler.add_model("model_1", model_1)
    data_handler.add_dataset("dataset_1", dataset_1)

    # train the model
    late_fusion.train()

    # predict using the trained model
    y_pred = late_fusion.predict(X_test)
    """

    def __init__(self, strategy_name: str, strategy_type:str, data_handler: DataHandler):
        """
        Initializes the late fusion strategy

        Parameters
        ----------
        strategy_name : str
            The name of the strategy
        data_handler : DataHandler
            The data handler object

        Returns
        -------
        None

        """
        super().__init__(strategy_name, strategy_type, data_handler)
        self._data_model_map = {}
        self.voting_type = "hard"
        self.voting_weights = None

    def add_model(self, model_name: str, model_type: str, model_params: dict = {}, model_input: str = None) -> None:
        """
        Adds a model to the strategy.

        Parameters:
        -----------
        model_name : str
            The name of the model.
        model_type : str
            The type of model to use.
        model_params : dict
            A dictionary of parameters for the model. Defaults to {}.
        model_input : str
            The name of the dataset to use as input for the model. Defaults to None.
        """
        if model_input is None:
            raise ValueError("model_input cannot be None for late fusion strategy")
        if model_input not in self.data_handler.dataset_names and model_input != "Output":
            raise ValueError(f"Dataset {model_input} does not exist")
        if model_name in self.model_handler.model_names and self._data_model_map[model_input] != model_name:
            raise ValueError(f"Model {model_name} already exists")

        if model_input == "Output":
            self.voting_type = model_params["voting"]
            self.voting_weights = model_params["weights"]

        else:
            self.model_handler.add_model(model_name, model_type, model_params)
            if model_input is not None:
                self.model_handler.models[model_name].model_input = model_input
            self._data_model_map[model_input] = model_name

    def train(self, run_name=None, validation_type: str = "holdout", validation_params: dict = {}) -> None:
        """
        Trains the models using the data from the dataset

        Parameters:
        -----------
        validation_type : str
            The type of validation to use. Defaults to "holdout".
        validation_params : dict
            A dictionary of parameters for the validation. Defaults to {}.

        Returns:
        --------
        None
        """

        model_predictions = []
        
        mlflow.set_tracking_uri("file:public/mlruns")
        with mlflow.start_run(run_name=run_name) as run:
            
            for dataset_name in self._data_model_map:
                model_name = self._data_model_map[dataset_name]
                X = self.data_handler.datasets[dataset_name].get_data(drop_target=True)
                y = self.data_handler.datasets[dataset_name].get_target()
                labels = y.unique()
                self.results = self.model_handler.train_model(model_name, X, y, validation_type, validation_params, return_predictions=True)
                model_predictions.append(self.results["probabilities"])
                y_actual = self.results["target"]

            # combine the predictions from each model as a voting ensemble
            voting_weights = np.array(self.voting_weights) if (self.voting_weights is not None and self.voting_weights != "None") else np.ones(len(model_predictions))
            
            if self.voting_type == "hard":
                # make model predictions as a one-hot vector
                model_predictions = np.eye(len(labels))[np.argmax(model_predictions, axis=2)]
                # multiply the predictions with the weights
                model_predictions *= voting_weights[:, None, None]
                # sum the predictions and take the argmax
                y_pred = np.argmax(np.sum(model_predictions, axis=0), axis=1)
            else:
                # multiply the predictions with the weights
                model_predictions *= voting_weights[:, None, None]
                # sum the predictions and take the argmax
                y_pred = np.argmax(np.sum(model_predictions, axis=0), axis=1)

            # calculate the metrics
            self._log_metrics(y_actual, y_pred)
            shap_values = self.results.pop('shap_values')

            def plot_summary():
                shap.summary_plot(shap_values, show=False, color_bar=True)
            self._log_image_artifact(plot_summary, "shap_summary_plot")

            def plot_feature_importance():
                shap.plots.bar(shap_values, show=False)
            self._log_image_artifact(plot_feature_importance, "shap_feature_importance_plot")
            self.results['artifact_uri'] = run.info.artifact_uri

        return self.results

    # TODO: implement predict method
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predicts the output using the trained model

        Parameters:
        -----------
        X : np.ndarray
            The input data

        Returns:
        --------
        np.ndarray
            The predicted output
        """
        return self.model_handler.predict(self.model_handler.model_names[0], X)
    

    def get_requirements(self) -> List[dict]:
        """
        Returns the required models and datasets for this strategy.

        Returns:
        --------
        A dictionary mapping model and dataset names to their required types.
        """

        requirements = []

        for dataset in self.data_handler.datasets:
            requirements.append({
                "name": dataset,
                "options": self.model_handler.get_supported_models_information(),
            })

        n_estimators = len(self.data_handler.datasets)

        requirements.append({
            "name": "Output",
            "options": [{
                "id": "voting",
                "description": "Voting (VT)",
                "group": "Ensemble",
                "library": "sklearn",
                "params": {
                    "voting": ["hard", "soft"],
                    "weights": [None] + list(permutations(range(1, n_estimators+1)))
                }
            }]
        })

        return requirements

    
    def get_graph(self) -> dict:
        """
        Returns a react-flow compatible graph of the strategy's models and datasets

        Returns:
        --------
        A dictionary containing the nodes and edges of the graph.
        """

        # Initialize an empty list to store nodes and edges
        nodes = []
        edges = []

        # Add the nodes for the datasets and models
        for idx, dataset_name in enumerate(self._data_model_map):
            nodes.append({
                "id": f"dataset_{dataset_name}",
                "type": "input",
                "data": {
                    "label": dataset_name
                },
                "position": {
                    "x": 200 * idx + 100,
                    "y": 50
                },
                "style": {
                    "border": "1px solid #e91e63"
                }
            })
            model_name = self._data_model_map[dataset_name]
            nodes.append({
                "id": f"model_{model_name}",
                "data": {
                    "label": model_name
                },
                "position": {
                    "x": 200 * idx + 100,
                    "y": 200
                },
                "style": {
                    "border": "1px solid #673ab7"
                }
            })

        # Add an ouput node
        nodes.append({
            "id": "output",
            "type": "output",
            "data": {
                "label": "Output"
            },
            "position": {
                "x": 100 * len(self._data_model_map),
                "y": 350
            },
            "style": {
                "border": "1px solid #4caf50"
            }
        })

        # Add the edges between the nodes
        for idx, dataset_name in enumerate(self._data_model_map):
            model_name = self._data_model_map[dataset_name]
            edges.append({
                "id": f"dataset_{dataset_name}-model_{model_name}",
                "source": f"dataset_{dataset_name}",
                "target": f"model_{model_name}",
                "type": "smoothstep",
                "animated": True,
                "style": {
                    "stroke": "#e91e63"
                }
            })
            edges.append({
                "id": f"model_{model_name}-output",
                "source": f"model_{model_name}",
                "target": "output",
                "type": "smoothstep",
                "animated": True,
                "style": {
                    "stroke": "#673ab7"
                }
            })

        return {
            "nodes": nodes,
            "edges": edges
        }

    