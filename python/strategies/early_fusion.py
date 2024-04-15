import numpy as np
import pandas as pd
import mlflow
import shap

from ..data import DataHandler
from .base import Strategy


class EarlyFusionStrategy(Strategy):
    """
    A class for implementing early fusion multimodal learning strategy.
    This strategy requires one model and one or more datasets. The data from the
    datasets is concatenated and passed to the model for training. This trained model can then
    also be used for prediction.

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
        Trains the model using the concatenated data from the datasets
    predict(X: np.ndarray) -> np.ndarray:
        Predicts the output using the trained model

    Example:
    --------
    # create a strategy object with a model and two datasets
    model_handler = ModelHandler()
    data_handler = DataHandler()
    early_fusion = EarlyFusion("early_fusion", model_handler, data_handler)
    model_handler.add_model("model_1", model_1)
    data_handler.add_dataset("dataset_1", dataset_1)
    data_handler.add_dataset("dataset_2", dataset_2)

    # train the model
    early_fusion.train()

    # predict using the trained model
    y_pred = early_fusion.predict(X_test)
    """

    def __init__(self, strategy_name: str, strategy_type:str, data_handler: DataHandler):
        super().__init__(strategy_name, strategy_type, data_handler)


    def add_model(self, model_name: str, model_type: str, model_params: dict = {}) -> None:
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
        """
        # If the model handler already has a model, remove it
        if self.model_handler.n_models > 0:
            self.model_handler.remove_model(self.model_handler.model_names[0])
        self.model_handler.add_model(model_name, model_type, model_params)


    def train(self, run_name=None, validation_type: str = "holdout", validation_params: dict = {}) -> None:
        """
        Trains the model using the concatenated data from the datasets.

        Parameters:
        -----------
        validation_type : str
            The type of validation to use for training the model. Defaults to "holdout".
        validation_params : dict
            A dictionary of parameters for the validation method. Defaults to {}. For
            "holdout" validation, the dictionary should contain the following keys:
            "test_size" (float): The proportion of the data to use for testing.
            "random_state" (int): The random seed to use for splitting the data.

        Raises:
        -------
        ValueError:
            If the number of datasets is less than 2.
        """
        # if len(self.data_handler.datasets) < 2:
        #     raise ValueError("Early fusion strategy requires at least 2 datasets.")

        X = pd.concat([self.data_handler.datasets[dataset].get_data(drop_target=True) for dataset in self.data_handler.datasets], axis=1) # assumes all datasets are in pandas dataframe format
        y = list(self.data_handler.datasets.values())[0].get_target() # assumes all datasets have the same target column

        model_name = self.model_handler.model_names[0]

        # train the model
        mlflow.set_tracking_uri("file:public/mlruns")
        with mlflow.start_run(run_name=run_name) as run:
            self.results = self.model_handler.train_model(model_name, X, y, validation_type, validation_params)
            self._log_metrics(self.results['target'], self.results['predictions'])
            self.results['artifact_uri'] = run.info.artifact_uri
            shap_values = self.results.pop('shap_values')

            def plot_summary():
                shap.summary_plot(shap_values, show=False, color_bar=True)
            self._log_image_artifact(plot_summary, "shap_summary_plot")

            def plot_feature_importance():
                shap.plots.bar(shap_values, show=False)
            self._log_image_artifact(plot_feature_importance, "shap_feature_importance_plot")
            
        return self.results


    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predicts the output using the trained model.

        Parameters:
        -----------
        X : np.ndarray
            The input data

        Returns:
        --------
        np.ndarray
            The predicted output
        """
        return self.model_handler.models[0].predict(X)

    def get_requirements(self) -> dict:
        """
        Returns the required models and datasets for this strategy.

        Returns:
        --------
        A dictionary mapping model and dataset names to their required types.
        """
        return {
            "n_models": 1, # exactly 1 model
            "n_datasets": [2, None], # at least 2 datasets
            # "model_types": ["classifier"],
            # "dataset_types": ["image", "text"]
        }

    def get_graph(self):
        """
        Returns a react-flow compatible graph of the strategy's models and datasets

        Returns:
        --------
        dict
            A dictionary containing the nodes and edges of the graph

        Example:
        --------
        {
            'nodes': [
                {
                    'id': 'dataset_0',
                    'type': 'input',
                    'data': {
                        'label': 'Dataset 1'
                    },
                    'position': {
                        'x': 100,
                        'y': 100
                    }
                },
                {
                    'id': 'dataset_1',
                    'type': 'input',
                    'data': {
                        'label': 'Dataset 2'
                    },
                    'position': {
                        'x': 200,
                        'y': 100
                    }
                },
                {
                    'id': 'model_0',
                    'type': 'output',
                    'data': {
                        'label': 'Model 1'
                    },
                    'position': {
                        'x': 150,
                        'y': 200
                    }
                }
            ],
            'edges': [
                {
                    'id': 'dataset_0-->model_0',
                    'source': 'dataset_0',
                    'target': 'model_0'
                },
                {
                    'id': 'dataset_1-->model_0',
                    'source': 'dataset_1',
                    'target': 'model_0'
                }
            ]
        }
        """

        # Initialize an empty list to store nodes and edges
        nodes = []
        edges = []

        # Add the datasets as nodes to the graph
        for idx, dataset_name in enumerate(self.data_handler.datasets):
            node = {
                'id': f'dataset_{dataset_name}',
                'type': 'input',
                'data': {
                    'label': dataset_name
                },
                'position': {
                    'x': 200 * idx + 100,
                    'y': 50
                },
                'style': {
                    'border': '1px solid #e91e63'
                }
            }
            nodes.append(node)

        # If there are no models, return the graph
        if self.model_handler.n_models == 0:
            return {
                'nodes': nodes,
                'edges': edges
            }

        # Add the model as a node to the graph
        model_name = self.model_handler.model_names[0]
        node = {
            'id': f'model_{model_name}',
            'type': 'output',
            'data': {
                'label': model_name
            },
            'position': {
                'x': 100 * len(self.data_handler.datasets),
                'y': 200
            },
            'style': {
                'border': '1px solid #673ab7'
            }
        }
        nodes.append(node)

        # Add edges from the input datasets to the model node
        for idx, dataset_name in enumerate(self.data_handler.datasets):
            edge = {
                'id': f'dataset_{dataset_name}-model_{model_name}',
                'source': f'dataset_{dataset_name}',
                'target': f'model_{model_name}',
                'type': 'smoothstep',
                'animated': True,
                'style': {
                    'stroke': '#e91e63'
                }
            }
            edges.append(edge)

        # Return the graph as a dictionary
        return {
            'nodes': nodes,
            'edges': edges
        }
