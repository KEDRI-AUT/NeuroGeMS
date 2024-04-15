import numpy as np
import mlflow
import shap

from ..data import DataHandler
from .base import Strategy


class UnimodalStrategy(Strategy):
    """
    A class for implementing unimodal learning strategy.
    This strategy requires one model and one dataset. The data from the
    dataset is passed to the model for training. This trained model can then
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
        Trains the model using the data from the dataset
    predict(X: np.ndarray) -> np.ndarray:
        Predicts the output using the trained model

    Example:
    --------
    # create a strategy object with a model and a dataset
    model_handler = ModelHandler()
    data_handler = DataHandler()
    unimodal = Unimodal("unimodal", model_handler, data_handler)
    model_handler.add_model("model_1", model_1)
    data_handler.add_dataset("dataset_1", dataset_1)

    # train the model
    unimodal.train()

    # predict using the trained model
    y_pred = unimodal.predict(X_test)
    """

    def __init__(self, strategy_name: str, strategy_type:str, data_handler: DataHandler):
        super().__init__(strategy_name, strategy_type, data_handler)

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
        # If the model handler already has a model, remove it
        if self.model_handler.n_models > 0:
            if model_input is None and self.model_handler.models[self.model_handler.model_names[0]].model_input is not None:
                model_input = self.model_handler.models[self.model_handler.model_names[0]].model_input
            self.model_handler.remove_model(self.model_handler.model_names[0])
        self.model_handler.add_model(model_name, model_type, model_params)
        if model_input is not None:
            self.model_handler.models[model_name].model_input = model_input

    def train(self, run_name=None, validation_type: str = "holdout", validation_params: dict = {}) -> None:
        """
        Trains the model using the data from the dataset.

        Parameters:
        -----------
        validation_type : str
            The type of validation to use. Defaults to "holdout".
        validation_params : dict
            A dictionary of parameters for the validation. Defaults to {}.
        """
        
        model_name = self.model_handler.model_names[0]
        model_input = self.model_handler.models[model_name].model_input

        # get the data from the dataset
        X = self.data_handler.datasets[model_input].get_data(drop_target=True)
        y = self.data_handler.datasets[model_input].get_target()

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
            "n_datasets": 1, # exactly 1 dataset
        }

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

        # If there are no models, return an empty graph
        if self.model_handler.n_models == 0:
            return {
                "nodes": nodes,
                "edges": edges,
            }

        # Add the model node
        model_name = self.model_handler.model_names[0]
        nodes.append({
            "id": f"model_{model_name}",
            "type": "output",
            "data": {
                "label": model_name,
            },
            "position": {
                "x": 100,
                "y": 200,
            },
            "style": {
                "border": "1px solid #673ab7",
            },
        })
        
        # Add the dataset node
        dataset_name = self.model_handler.models[model_name].model_input
        nodes.append({
            "id": f"dataset_{dataset_name}",
            "type": "input",
            "data": {
                "label": dataset_name,
            },
            "position": {
                "x": 100,
                "y": 50,
            },
            "style": {
                "border": "1px solid #e91e63",
            },
        })

        # Add the edge between the model and the dataset
        edges.append({
            "id": f"dataset_{dataset_name}-model_{model_name}",
            "source": f"dataset_{dataset_name}",
            "target": f"model_{model_name}",
            "type": "smoothstep",
            "animated": True,
            "style": {
                "stroke": "#e91e63",
            },
        })
        
        return {
            "nodes": nodes,
            "edges": edges,
        }
        