import pandas as pd
from sklearn.model_selection import KFold, StratifiedKFold, LeaveOneOut, train_test_split

from .data import DataHandler
from .model import ModelHandler, MLModel

##########################################################################################

SUPPORTED_VALIDATIONS = {
    "kfold": {
        "description": "K-Fold Cross Validation",
        "library": "sklearn",
        "function": KFold,
        "params": {
            "n_splits": [2, 3, 4, 5, 6, 7, 8, 9, 10],
            "shuffle": [True, False],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
    "stratified_kfold": {
        "description": "Stratified K-Fold Cross Validation",
        "library": "sklearn",
        "function": StratifiedKFold,
        "params": {
            "n_splits": [2, 3, 4, 5, 6, 7, 8, 9, 10],
            "shuffle": [True, False],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
    "leave_one_out": {
        "description": "Leave One Out Cross Validation",
        "library": "sklearn",
        "function": LeaveOneOut,
        "params": {}
    },
    "holdout": {
        "description": "Holdout Validation",
        "library": "sklearn",
        "function": train_test_split,
        "params": {
            "test_size": [0.1, 0.2, 0.3, 0.4, 0.5],
            "shuffle": [True, False],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
}

##########################################################################################

class PipelineHandler():
    """
    The `PipelineHandler` class is responsible for building a pipeline that defines how the
    data will flow through the different models in a machine learning workflow. It allows
    the user to specify the input data sources for each model and the data transformations
    that should be applied before the data is fed into the model.
    """


    def __init__(self, data_handler:DataHandler, model_handler:ModelHandler):
        """
        Initializes the pipeline

        Parameters
        ----------
        data_handler : DataHandler
            The data handler object
        model_handler : ModelHandler
            The model handler object

        """
        self.data_handler = data_handler
        self.model_handler = model_handler
        self.pipelines = {}

    def add_pipeline(self, pipeline: str, input_sources: list):
        """
        Adds a new pipeline to the pipeline

        Parameters
        ----------
        pipeline : str
            The name of the pipeline
        input_sources : list
            The list of input sources for the pipeline where each input source is a dictionary with
            the following keys:
                - type: The type of input source. Can be either 'dataset' or 'model'
                - name: The name of the dataset or model
                - transformations: The list of transformations to apply to the data before it is
                    fed into the model
                


        Returns
        -------
        None

        """
        self.pipelines[pipeline] = {
            "input_sources": input_sources
        }
        
    def _generate_pipeline_input(self, input_sources: list):
        """
        Generates the input data for the pipeline. If pipeline is of library 'sklearn', 'xgboost', or 'sklearn-compatible',
        concatenates the input data into a single dataframe.
        
        Parameters
        ----------
        input_sources : list
            The list of input sources for the pipeline where each input source is a dictionary with
            the following keys:
                - type: The type of input source. Can be either 'dataset' or 'model'
                - name: The name of the dataset or model
                - transformations: The list of transformations to apply to the data before it is
                    fed into the model
        Returns
        -------
            
        """
        input_data = []
        for input_source in input_sources:
            if input_source["type"] == "dataset":
                dataset = self.data_handler.get_dataset


##########################################################################################

class Pipeline():
    """
    The `Pipeline` class is responsible for building a pipeline that defines how the
    data will flow through the different models in a machine learning workflow. It allows
    the user to specify the input data sources for each model and the data transformations
    that should be applied before the data is fed into the model.
    """


    def __init__(self, data_handler:DataHandler):
        """
        Initializes the pipeline

        Parameters
        ----------
        data_handler : DataHandler
            The data handler object

        """
        self.data_handler = data_handler
        self.model_handler = ModelHandler()
        self.model_inputs = {}

    def add_model(self, model_name: str, model_type: str, model_params: dict, input_sources: list):
        """
        Adds a new model to the pipeline

        Parameters
        ----------
        model_name : str
            The name of the model

        model_type : str
            The type of the model. For example, "svm" or "decision_tree".

        model_params : dict
            The parameters for the model

        input_sources : list
            The list of input sources for the model where each input source is a dictionary with
            the following keys:
                - type: The type of input source. Can be either 'dataset' or 'model'
                - name: The name of the dataset or model
                - transformations: The list of transformations to apply to the data before it is
                    fed into the model

        Returns
        -------
        None

        """
        self.model_handler.add_model(model_name, model_type, model_params)
        self.model_inputs[model_name] = input_sources
        
    def _generate_model_input(self, input_sources: list):
        """
        Generates the input data for the model. If model is of library 'sklearn', 'xgboost', or 'sklearn-compatible',
        concatenates the input data into a single dataframe.
        
        Parameters
        ----------
        input_sources : list
            The list of input sources for the model where each input source is a dictionary with
            the following keys:
                - type: The type of input source. Can be either 'dataset' or 'model'
                - name: The name of the dataset or model
                - transformations: The list of transformations to apply to the data before it is
                    fed into the model
                    
        Returns
        -------
            
        """
        input_data = []
        for input_source in input_sources:
            if input_source["type"] == "dataset":
                dataset = self.data_handler.get_dataset(input_source["name"])
                data = dataset.get_data()
                for transformation in input_source["transformations"]:
                    data = transformation.transform(data)
                input_data.append(data)
            elif input_source["type"] == "model":
                model = self.model_handler.get_model(input_source["name"])
                data = model.get_output()
                for transformation in input_source["transformations"]:
                    data = transformation.transform(data)
                input_data.append(data)
            else:
                raise ValueError("Invalid input source type")
        return input_data

    def train(self, validation_type:str, validation_params:dict={}):
        """
        Trains the models in the pipeline
        
        Parameters
        ----------
        validation_type : str
            The type of validation to use

        validation_params : dict, default={}
            Parameters of the validation strategy.
        
        Returns
        -------
        None
        """

        if validation_type not in SUPPORTED_VALIDATIONS:
            raise ValueError("Invalid validation type")

        validation = SUPPORTED_VALIDATIONS[validation_type]
        validation_function = validation["function"](**validation_params)

        for model_name, model_inputs in self.models.items():
            if model.library in ["sklearn", "xgboost", "sklearn-compatible"]:
                input_data = self._get_model_input(model_inputs)
                input_data = pd.concat(input_data, axis=1)
            else:
                raise ValueError("Invalid model library")
            model = self.model_handler.train_model(model_name, input_data, validation_type, validation_params)