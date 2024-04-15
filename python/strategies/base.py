from abc import ABC, abstractmethod
from typing import Any
import os
import numpy as np
import sklearn
import mlflow
import matplotlib.pyplot as plt

from ..data import DataHandler
from ..model import ModelHandler


class Strategy(ABC):
    """
    Base class for unimodal/multimodal learning strategies.

    Attributes:
    -----------
    model_handler: ModelHandler
        Handler for the models used in the strategy.
    data_handler: DataHandler
        Handler for the datasets used in the strategy.

    Methods:
    --------
    train(self, data: dict) -> typing.Any:
        Trains the pipeline using the provided data.
    predict(self, data: dict) -> typing.Any:
        Makes predictions using the trained pipeline.
    get_requirements(self) -> dict:
        Returns the required models and datasets for this strategy.
    get_graph(self) -> dict:
        Returns the adjacency list of models and datasets used in the strategy.
    """

    def __init__(self, strategy_name:str, strategy_type:str, data_handler: DataHandler):
        self.name = strategy_name
        self.type = strategy_type
        self.version = 1
        self.data_handler = data_handler
        self.model_handler = ModelHandler()

    def _log_metrics(self, y_actual, y_pred) -> dict:
        """
        Logs the metrics to mlflow.

        Parameters:
        -----------
        metrics: dict
            A dictionary mapping metric names to their values.
        """
        
        if self.results is None:
            self.results = {}
        
        self.results['accuracy'] = sklearn.metrics.accuracy_score(y_actual, y_pred)*100
        mlflow.log_metric('accuracy', self.results['accuracy'])
        
        self.results['confusion_matrix'] = sklearn.metrics.confusion_matrix(y_actual, y_pred).tolist()
        mlflow.log_param('confusion_matrix', self.results['confusion_matrix'])
        
        self.results['precision'], self.results['recall'], self.results['f1_score'], _ = sklearn.metrics.precision_recall_fscore_support(y_actual, y_pred, average=None)
        
        self.results['precision'] = self.results['precision'].tolist()
        mlflow.log_param('precision_classwise', self.results['precision'])
        mlflow.log_metric('precision', np.mean(self.results['precision']))
        
        self.results['recall'] = self.results['recall'].tolist()
        mlflow.log_param('recall_classwise', self.results['recall'])
        mlflow.log_metric('recall', np.mean(self.results['recall']))
        
        self.results['f1_score'] = self.results['f1_score'].tolist()
        mlflow.log_param('f1_score_classwise', self.results['f1_score'])
        mlflow.log_metric('f1_score', np.mean(self.results['f1_score']))
        
    def _log_image_artifact(self, plot, name):
        """Log an image artifact to MLflow.

        Parameters
        ----------
        plot : object
            The plot to be logged.

        name : str
            The name of the plot.

        Returns
        -------
        None
        """
        
        os.makedirs("temp_artifacts", exist_ok=True)

        artifact_file_local_path = os.path.join("temp_artifacts", f"{name}.png")

        cmap = plt.get_cmap("RdYlGn")

        try:
            plt.clf()
            plot()
            for fc in plt.gcf().get_children():
                for fcc in fc.get_children():
                    if hasattr(fcc, "set_cmap"):
                        fcc.set_cmap(cmap)
            plt.savefig(artifact_file_local_path, bbox_inches="tight")
        finally:
            plt.close(plt.gcf())

        mlflow.log_artifact(artifact_file_local_path)

    @abstractmethod
    def train(self, data: dict) -> Any:
        """
        Train the pipeline using the provided data.

        Parameters:
        -----------
        data: dict
            A dictionary mapping dataset names to their corresponding numpy arrays.

        Returns:
        --------
        The trained pipeline object.
        """
        pass

    @abstractmethod
    def predict(self, data: dict) -> Any:
        """
        Make predictions using the trained pipeline.

        Parameters:
        -----------
        data: dict
            A dictionary mapping dataset names to their corresponding numpy arrays.

        Returns:
        --------
        The predicted values.
        """
        pass

    @abstractmethod
    def get_requirements(self) -> dict:
        """
        Get the required models and datasets for this strategy.

        Returns:
        --------
        A dictionary mapping model and dataset names to their required types.
        """
        pass

    @abstractmethod
    def get_graph(self) -> dict:
        """
        Get the adjacency list of models and datasets used in the strategy.

        Returns:
        --------
        A dictionary mapping model and dataset names to their inputs and outputs.
        """
        pass