from typing import List
import mlflow
from sklearn.metrics import *

##########################################################################################

SUPPORTED_METRICS = {}

classification_metrics = [
    accuracy_score,
    balanced_accuracy_score,
    cohen_kappa_score,
    f1_score,
    fbeta_score,
    jaccard_score,
    matthews_corrcoef,
    precision_score,
    recall_score,
    roc_auc_score,
]

for metric in classification_metrics:
    SUPPORTED_METRICS[metric.__name__] = {
        "description": metric.__doc__.split("Read more")[0].strip(),
        "function": metric,
        "type": "classification"
    }

##########################################################################################

class ExperimentHandler():
    """
    The `ExperimentHandler` class is responsible for tracking the experiments. It allows
    the user to train the models and do parameter optimization.
    """

    def __init__(self, strategy_handler):
        self.strategy_handler = strategy_handler
        self.experiments = []
        mlflow.set_tracking_uri("file:public/mlruns")
        mlflow.set_experiment("default")
        self.mlflow_client = mlflow.tracking.MlflowClient()
        self.mlflow_experiment = self.mlflow_client.get_experiment_by_name("default")

    def get_supported_metrics_information(self) -> List[dict]:
        """
        Returns a list of dictionaries containing information about the supported metrics.

        Returns:
        --------
        A list of dictionaries containing information about the supported metrics.
        """
        return [
            {
                "name": metric_name,
                "description": metric_info["description"],
                "type": metric_info["type"]
            }
            for metric_name, metric_info in SUPPORTED_METRICS.items()
        ]

    def run_experiment(self, name, type, parameters, metrics):
        """
        Runs an experiment.

        Parameters:
        -----------
        name: str
            The name of the experiment.

        type: str
            The type of the experiment.

        parameters: dict
            The parameters of the experiment.

        metrics: list
            The metrics to use.
        """

        if type!="train_model":
            raise Exception("Unsupported experiment type!")

        # Get model
        strategy_name = parameters["strategy_name"]
        validation = parameters["validation"]
        validation_parameters = parameters["validation_parameters"]
        validation_parameters = {k: None if v == "None" else v for k, v in validation_parameters.items()}

        # Train model
        training_results = self.strategy_handler.train_strategy(strategy_name, validation, validation_parameters)

        self.experiments.append({
            "name": name,
            "type": type,
            "parameters": parameters,
            "metrics": metrics,
            "results": training_results
        })

        return self.experiments
    
    def get_experiment_runs(self):
        """
        Returns the experiment runs.

        Returns:
        --------
        The experiment runs.
        """
        # Get a list of experiment runs
        mlflow_runs = self.mlflow_client.search_runs(self.mlflow_experiment.experiment_id, order_by=["attributes.start_time DESC"])
        
        runs = []
        for run in mlflow_runs:
            runs.append({
                "id": run.info.run_id,
                "name": run.info.run_name,
                "created_at": run.info.start_time,
                "status": run.info.status,
                "artifact_uri": run.info.artifact_uri,
                "params": run.data.params,
                "metrics": run.data.metrics
            })
        return runs


    def get_experiments_log(self):
        """
        Returns the experiments log.

        Returns:
        --------
        The experiments log.
        """
        return self.experiments

