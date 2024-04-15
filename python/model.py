import numpy as np
import pickle, os
import sklearn
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, KFold, StratifiedKFold, LeaveOneOut
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor, RadiusNeighborsClassifier, RadiusNeighborsRegressor
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor
from xgboost import XGBClassifier, XGBRegressor
import mlflow
import shap
from matplotlib import pyplot as plt
# from tensorflow import keras
from .data import Dataset
from .models import WWKNNClassifier, ESNClassifier

##########################################################################################

SUPPORTED_MODELS = {
    "svm": {
        "description": "Support Vector Machine (SVM)",
        "group": "Linear",
        "library": "sklearn",
        "classifier": SVC,
        "regressor": SVR,
        "params": {
            "C": [0.1, 1, 10, 100, 1000],
            "gamma": [1, 0.1, 0.01, 0.001, 0.0001],
            "kernel": ["rbf", "linear"]
        }
    },
    "logistic_regression": {
        "description": "Logistic Regression (LR)",
        "group": "Linear",
        "library": "sklearn",
        "classifier": LogisticRegression,
        "regressor": None,
        "params": {
            "C": [0.1, 1, 10, 100, 1000],
            "penalty": ["l1", "l2"],
            "solver": ["liblinear", "saga"]
        }
    },
    "knn": {
        "description": "K-Nearest Neighbors (KNN)",
        "group": "Neighborhood",
        "library": "sklearn",
        "classifier": KNeighborsClassifier,
        "regressor": KNeighborsRegressor,
        "params": {
            "n_neighbors": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "weights": ["uniform", "distance"],
            "algorithm": ["auto", "ball_tree", "kd_tree", "brute"],
            "p": [1, 2]
        }
    },
    "radius_neighbors": {
        "description": "Radius Neighbors (RN)",
        "group": "Neighborhood",
        "library": "sklearn",
        "classifier": RadiusNeighborsClassifier,
        "regressor": RadiusNeighborsRegressor,
        "params": {
            "radius": [1.0, 2.0, 3.0, 4.0, 5.0],
            "weights": ["uniform", "distance"],
            "algorithm": ["auto", "ball_tree", "kd_tree", "brute"],
            "p": [1, 2]
        }
    },
    "decision_tree": {
        "description": "Decision Tree (DT)",
        "group": "Tree",
        "library": "sklearn",
        "classifier": DecisionTreeClassifier,
        "regressor": DecisionTreeRegressor,
        "params": {
            "criterion": ["gini", "entropy"],
            "max_depth": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "min_samples_split": [2, 3, 4, 5, 6, 7, 8, 9, 10],
            "min_samples_leaf": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
    "random_forest": {
        "description": "Random Forest (RF)",
        "group": "Tree",
        "library": "sklearn",
        "classifier": RandomForestClassifier,
        "regressor": RandomForestRegressor,
        "params": {
            "n_estimators": [100, 200, 300, 400, 500],
            "criterion": ["gini", "entropy"],
            "max_depth": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "min_samples_split": [2, 3, 4, 5, 6, 7, 8, 9, 10],
            "min_samples_leaf": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
    "xgboost": {
        "description": "XGBoost (GBDT)",
        "group": "Tree",
        "library": "xgboost",
        "classifier": XGBClassifier,
        "regressor": XGBRegressor,
        "params": {
            "n_estimators": [100, 200, 300, 400, 500],
            "max_depth": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "learning_rate": [0.01, 0.05, 0.1, 0.2, 0.3],
            "subsample": [0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            "colsample_bytree": [0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
        }
    },
    "wwknn": {
        "description": "Weighted Weighted K-Nearest Neighbors (WWKNN)",
        "group": "Personalized",
        "library": "sklearn-compatible",
        "classifier": WWKNNClassifier,
        # "regressor": WWKNNRegressor,
        "params": {
            "n_neighbors": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "weights": ["uniform", "distance"],
            "per_class": [True, False],
            "feature_importance": [None, "chi2", "f_classif", "mutual_info_classif"]
        }
    },
    # "pcnfi": {
    #     "description": "Personalized Constrained Neuro-Fuzzy Inference (PCNFI)",
    #     "group": "Personalized",
    #     "library": "sklearn-compatible",
    #     "classifier": PCNFI,
    #     "regressor": PCNFI,
    #     "params": {
    #         "n_neighbors": [10, 20, 30, 40, 50],
    #         "learning_rate": [0.01, 0.05, 0.1, 0.2, 0.3],
    #         "max_iter": [100, 200, 300, 400, 500],
    #         "n_rules": [2, 3, 4, 5, 6, 7, 8, 9, 10],
    #     }
    # },
    "esn": {
        "description": "Echo State Network (ESN)",
        "group": "Neural Network",
        "library": "sklearn-compatible",
        "classifier": ESNClassifier,
        # "regressor": ESNRegressor,
        "params": {
            "n_reservoir": [10, 100, 1000, 10000],
            "spectral_radius": [0.95, 0.1, 0.3, 0.5, 0.7, 0.9, 1.0],
            "sparsity": [0.1, 0.2, 0.3, 0.4, 0.5],
            "noise": [0.0001, 0.001, 0.01, 0.1, 1.0],
            "input_scaling": [1.0, 0, 0.1, 0.5, 2.0, 5.0],
            "feedback_scaling": [0, 0.1, 0.5, 1.0, 2.0, 5.0],
        }
    },
}

##########################################################################################

SUPPORTED_VALIDATIONS = {
    "holdout": {
        "description": "Train-Test Split",
        "library": "sklearn",
        "function": train_test_split,
        "params": {
            "test_size": [0.1, 0.2, 0.3, 0.4, 0.5],
            "shuffle": [True, False],
            "random_state": [None, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        }
    },
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
}

##########################################################################################

class ModelHandler():
    """
    This class is used to handle multiple models, their parameters, and their training.
    """

    def __init__(self):
        """
        Initialize the ModelHandler.

        Attributes
        ----------
        models: dict
            A dictionary containing the models.

        model_names: list
            A list containing the names of the models.

        model_params: dict
            A dictionary containing the parameters of the models.

        Returns
        -------
        None
        """
        self.models = {}
        self.model_names = []
        self.n_models = 0


    def get_supported_models_information(self, group=None, library=None):
        """
        Get information about the supported models.

        Parameters
        ----------
        group: str, optional (default=None)
            The group of the models. For example, "Supervised Learning" or "Unsupervised Learning".

        library: str, optional (default=None)
            The library of the models. For example, "sklearn" or "sklearn-compatible".

        Returns:
        --------
        supported_models_info: list
            A list of dictionaries containing information about the supported models.
        """
        supported_models_info = []

        for model in SUPPORTED_MODELS:
            
            if group is not None and SUPPORTED_MODELS[model]["group"] != group:
                continue
            
            if library is not None and SUPPORTED_MODELS[model]["library"] != library:
                continue

            supported_models_info.append({
                "id": model,
                "description": SUPPORTED_MODELS[model]["description"],
                "group": SUPPORTED_MODELS[model]["group"],
                "library": SUPPORTED_MODELS[model]["library"],
                "params": SUPPORTED_MODELS[model]["params"]
            })

        return supported_models_info


    def add_model(self, model_name, model_type, model_params):
        """
        Adds a new model to the collection.

        Parameters
        -----------
        model_name: str
            The name of the model.

        model_type: str
            The type of the model. For example, "svm" or "decision_tree".

        model_params: dict
            The parameters of the model.

        Returns
        -------
        None
        """
        self.models[model_name] = MLModel(model_name, model_type, model_params)
        self.model_names.append(model_name)
        self.n_models += 1


    def get_model(self, model_name):
        """
        Get a model from the collection.

        Parameters
        ----------
        model_name: str
            The name of the model.

        Returns
        -------
        model: MLModel
            The model.
        """
        return self.models[model_name]


    def get_models(self):
        """
        Get all models from the collection.

        Returns
        -------
        model_list: list
            A list of all models.
        """
        model_list = []
        for model_name in self.model_names:
            model_list.append(self.get_model(model_name))
        return model_list


    def remove_model(self, model_name):
        """
        Remove a model from the collection.

        Parameters
        ----------
        model_name: str
            The name of the model.

        Returns
        -------
        None
        """
        self.models.pop(model_name)
        self.model_names.remove(model_name)
        self.n_models -= 1


    def train_model(self, model_name, data, target, validation_type, validation_params, return_predictions=False):
        """
        Train a model.

        Parameters
        ----------
        model_name: str
            The name of the model.

        data: numpy.ndarray
            The data to train the model on.

        target: numpy.ndarray
            The target to train the model on.

        validation_type: str
            The type of validation. For example, "k_fold" or "holdout".

        validation_params: dict
            The parameters of the validation strategy.

        return_predictions: bool
            Whether to return the predictions of the model.

        Returns
        -------
        results: dict
            A dictionary containing the results of the training.
        """

        results = self.models[model_name].train(data, target, validation_type, validation_params, return_predictions)
        return results

    def save_model(self, model_name, path):
        """
        Save a model.

        Parameters
        ----------
        model_name: str
            The name of the model.

        path: str
            The path to save the model.

        Returns
        -------
        None
        """
        self.models[model_name].save(path)

    def load_model(self, model_name, path):
        """
        Load a model.

        Parameters
        ----------
        model_name: str
            The name of the model.

        path: str
            The path to load the model.

        Returns
        -------
        None
        """
        self.models[model_name].load(path)


##########################################################################################

class MLModel():

    def __init__(self, model_name:str, model_type:str, model_params:dict={}):
        """Initializes MLModel object.

        Parameters
        ----------
        model_name : str, default=None
            Name of the model to be used.

        model_type : str, default=None
            Type of the model to be initialized.

        model_params : dict, default={}
            Parameters of the model to be initialized.

        Returns
        -------
        None
        """
        self.name = model_name
        self.type = model_type
        self.params = model_params
        self.model = self._init_model(model_type, model_params)
        self.library = SUPPORTED_MODELS[model_type]["library"]
        # mlflow.set_tracking_uri("file:public/mlruns")


    def _init_model(self, model_type:str, model_params:dict={}):
        """Initialize the model using one of the libraries.

        Parameters
        ----------
        model_type : str, default=None
            Type of the model to be initialized.

        model_params : dict, default={}
            Parameters of the model to be initialized.

        Returns
        -------
        model : object
            Object of the model initialized.
        """
        
        if model_type not in SUPPORTED_MODELS:
            raise Exception("Model type not supported.")

        model = SUPPORTED_MODELS[model_type]["classifier"](**model_params)

        return model

    def _reinitialize_model(self):
        """Reinitialize the model.

        Parameters
        ----------
        None

        Returns
        -------
        None
        """
        self.model = self._init_model(self.type, self.params)


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


    def get_model(self):
        """Returns current model.

        Parameters
        ----------
        None

        Returns
        -------
        model : object
            Object of current model.
        """
        return self.model
        

    def train(self, data, target, validation_type:str, validation_params:dict={}, return_predictions:bool=False):
        """Trains the model for the given data.

        Parameters
        ----------
        data : array-like
            Data to be used for training.

        target : array-like
            Target to be used for training.

        validation_type : str
            Type of validation to be used.

        validation_params : dict
            Parameters of the validation strategy.

        return_predictions : bool, default=False
            Whether to return the predictions.

        Returns
        -------
        results : dict
            Dictionary containing the results of the training.
        """
        X = data
        label_encoder = sklearn.preprocessing.LabelEncoder()
        y = label_encoder.fit_transform(target)
        
        if self.library == 'sklearn' or self.library == 'xgboost' or self.library == 'sklearn-compatible':
            for param in self.model.get_params().keys():
                mlflow.log_param(param, self.model.get_params()[param])

        # Split the dataset into train and test
        if validation_type == 'holdout':
            X_train, X_test, y_train, y_test = SUPPORTED_VALIDATIONS[validation_type]["function"](X, y, **validation_params)

            # Use the library's functions for training
            if self.library == 'sklearn' or self.library == 'xgboost' or self.library == 'sklearn-compatible':
                if return_predictions and 'probability' in self.model.get_params().keys():
                    self.model.set_params(**{'probability': True})
                self.model.fit(X_train, y_train)
                y_pred = self.model.predict(X_test).tolist()
                X_actual, y_actual = X_test, y_test.tolist()
                if return_predictions:
                    y_prob = self.model.predict_proba(X_test).tolist()

        else:
            if validation_type not in SUPPORTED_VALIDATIONS:
                raise Exception("Validation type not supported.")

            cv = SUPPORTED_VALIDATIONS[validation_type]["function"](**validation_params)
            y_pred, X_actual, y_actual, y_prob = [], [], [], []

            for train_index, test_index in cv.split(X):
                X_train, X_test = X.iloc[train_index], X.iloc[test_index]
                y_train, y_test = y[train_index], y[test_index]
                
                # Reinitialize the model
                self._reinitialize_model()

                # Use the library's functions for training
                if self.library == 'sklearn' or self.library == 'xgboost' or self.library == 'sklearn-compatible':
                    if return_predictions and 'probability' in self.model.get_params().keys():
                        self.model.set_params(**{'probability': True})
                    self.model.fit(X_train, y_train)
                    y_pred.extend(self.model.predict(X_test).tolist())
                    X_actual.extend(X_test.values.tolist())
                    y_actual.extend(y_test.tolist())
                    if return_predictions:
                        y_prob.extend(self.model.predict_proba(X_test).tolist())

                # elif self.model_type == 'keras':
                #     self.model.compile(loss="categorical_crossentropy", optimizer="adam", metrics=["accuracy"])
                #     self.model.fit(X_train, y_train, batch_size=self.keras_params['batch_size'], epochs=self.keras_params['epochs'], validation_split=self.keras_params['validation_split'])

        # Compute SHAP values
        shap_values = []
        if self.library == 'sklearn' or self.library == 'xgboost' or self.library == 'sklearn-compatible':
            explainer = shap.Explainer(self.model.predict, X_train)
            shap_values = explainer(X)

            # def plot_summary():
            #     shap.summary_plot(shap_values, show=False, color_bar=True)
            # self._log_image_artifact(plot_summary, "shap_summary_plot")

            # def plot_feature_importance():
            #     shap.plots.bar(shap_values, show=False)
            # self._log_image_artifact(plot_feature_importance, "shap_feature_importance_plot")

        # Store the results
        self.results = {}
        self.results['labels'] = label_encoder.classes_.tolist()
        mlflow.log_param('labels', self.results['labels'])
        self.results['predictions'] = y_pred
        self.results['target'] = y_actual
        self.results['shap_values'] = shap_values
        if return_predictions:
            self.results['probabilities'] = y_prob
        
        return self.results
        
    def predict(self, X, with_probability:bool=False):
        """Predicts the output for the given data.

        Parameters
        ----------
        X : array-like
            Data to be used for prediction.

        with_probability : bool, default=False
            Whether to return the probabilities of the predicted labels or not.

        Returns
        -------
        results : dict
            Dictionary containing the results of the prediction.
        """

        # Use the library's functions for prediction
        if self.library == 'sklearn' or self.library == 'xgboost' or self.library == 'sklearn-compatible':
            y_pred = self.model.predict(X)
            if with_probability:
                # TODO: This runs predict twice. Find a way to run it only once.
                y_prob = self.model.predict_proba(X)

        # Store the results
        results = {}
        results['predictions'] = y_pred.tolist()
        if with_probability:
            results['probabilities'] = y_prob.tolist()
        
        return results

    def save(self, path:str):
        """Saves the MLModel object to the given path.

        Parameters
        ----------
        path : str
            Path to save the model.

        Returns
        -------
        None
        """
        with open(path, 'wb') as f:
            pickle.dump(self, f)

    @staticmethod
    def load(path:str):
        """Loads the MLModel object from the given path.

        Parameters
        ----------
        path : str
            Path to load the model.

        Returns
        -------
        model : MLModel
            MLModel object loaded.
        """
        with open(path, 'rb') as f:
            model = pickle.load(f)
        return model

    def __str__(self):
        """Returns the string representation of the MLModel object.

        Parameters
        ----------
        None

        Returns
        -------
        str
            String representation of the MLModel object.
        """
        return f"Name: {self.name}\nType: {self.type}\nParameters: {self.params}\nResults: {self.results}"