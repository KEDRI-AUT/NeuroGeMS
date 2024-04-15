import numpy as np
from sklearn.preprocessing import StandardScaler, MinMaxScaler, RobustScaler, MaxAbsScaler, QuantileTransformer, PowerTransformer, Normalizer, Binarizer, FunctionTransformer, PolynomialFeatures, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer, KNNImputer

SUPPORTED_TRANSFORMERS = {
    "standard_scaler": {
        "name": "Standard Scaler",
        "description": "Standardize features by removing the mean and scaling to unit variance",
        "function": StandardScaler,
        "group": "Scaling",
        "parameters": {
            "with_mean": [True, False],
            "with_std": [True, False]
        }
    },
    "min_max_scaler": {
        "name": "Min Max Scaler",
        "description": "Transform features by scaling each feature to a given range",
        "function": MinMaxScaler,
        "group": "Scaling",
        "parameters": {
            "feature_range": [(0, 1), (-1, 1), (0, 2)]
        }
    },
    "robust_scaler": {
        "name": "Robust Scaler",
        "description": "Scale features using statistics that are robust to outliers",
        "function": RobustScaler,
        "group": "Scaling",
        "parameters": {
            "with_centering": [True, False],
            "with_scaling": [True, False]
        }
    },
    "max_abs_scaler": {
        "name": "Max Abs Scaler",
        "description": "Scale each feature by its maximum absolute value",
        "function": MaxAbsScaler,
        "group": "Scaling",
        "parameters": {}
    },
    "quantile_transformer": {
        "name": "Quantile Transformer",
        "description": "Transform features using quantiles information",
        "function": QuantileTransformer,
        "group": "Scaling",
        "parameters": {
            "n_quantiles": [100, 1000, 10000],
            "output_distribution": ["uniform", "normal"]
        }
    },
    "power_transformer": {
        "name": "Power Transformer",
        "description": "Apply a power transform featurewise to make data more Gaussian-like",
        "function": PowerTransformer,
        "group": "Scaling",
        "parameters": {
            "method": ["yeo-johnson", "box-cox"],
            "standardize": [True, False]
        }
    },
    "normalizer": {
        "name": "Normalizer",
        "description": "Scale input vectors individually to unit norm",
        "function": Normalizer,
        "group": "Scaling",
        "parameters": {
            "norm": ["l1", "l2", "max"]
        }
    },
    "binarizer": {
        "name": "Binarizer",
        "description": "Binarize data (set feature values to 0 or 1) according to a threshold",
        "function": Binarizer,
        "group": "Encoding",
        "parameters": {
            "threshold": [0.0, 0.5, 1.0]
        }
    },
    "function_transformer": {
        "name": "Function Transformer",
        "description": "Construct a transformer from an arbitrary callable",
        "function": FunctionTransformer,
        "parameters": {
            "func": [np.log1p, np.expm1, np.sqrt, np.square],
            "inverse_func": [np.log1p, np.expm1, np.sqrt, np.square],
            "validate": [True, False],
            "accept_sparse": [True, False],
            "check_inverse": [True, False],
            "kw_args": [None, {"a": 1}],
            "inv_kw_args": [None, {"a": 1}]
        }
    },
    "polynomial_features": {
        "name": "Polynomial Features",
        "description": "Generate polynomial and interaction features",
        "function": PolynomialFeatures,
        "parameters": {
            "degree": [2, 3],
            "interaction_only": [True, False],
            "include_bias": [True, False]
        }
    },
    "one_hot_encoder": {
        "name": "One Hot Encoder",
        "description": "Encode categorical features as a one-hot numeric array",
        "function": OneHotEncoder,
        "group": "Encoding",
        "parameters": {
            "categories": ["auto"],
            "drop": ["first"],
            "sparse": [True, False],
        }
    },
    "label_encoder": {
        "name": "Label Encoder",
        "description": "Encode categorical features to numeric values",
        "function": LabelEncoder,
        "group": "Encoding",
        "parameters": {
            "categories": ["auto"],
            "drop": ["first"],
            "sparse": [True, False],
        }
    },
    "simple_imputer": {
        "name": "Simple Imputer",
        "description": "Imputation transformer for completing missing values",
        "function": SimpleImputer,
        "group": "Imputation",
        "parameters": {
            # "missing_values": [np.nan],
            "strategy": ["mean", "median", "most_frequent", "constant"],
            "fill_value": [None],
            "verbose": [0],
            "copy": [True],
            "add_indicator": [False]
        }
    },
    "knn_imputer": {
        "name": "KNN Imputer",
        "description": "Imputation for completing missing values using k-Nearest Neighbors",
        "function": KNNImputer,
        "group": "Imputation",
        "parameters": {
            # "missing_values": [np.nan],
            "n_neighbors": [5, 10, 15],
            "weights": ["uniform", "distance"],
            "metric": ["nan_euclidean", "nan_manhattan", "nan_minkowski"],
        }
    }
}


class DataTransformer():
    """
    Class to wrap sklearn transformers

    Parameters
    ----------
    transformer_type : str
        Type of transformer to use
    tranformer_parameters : dict
        Parameters to pass to the transformer

    Attributes
    ----------
    transformer : sklearn transformer
        Transformer to use
    type : str
        Type of transformer
    parameters : dict
        Parameters to pass to the transformer

    Methods
    -------
    fit(X)
        Fit the transformer to the data
    transform(X)
        Transform the data

    Examples
    --------
    >>> from preprocessing import DataTransformer
    >>> import numpy as np
    >>> X = np.array([[1, 2], [3, 4]])
    >>> transformer = DataTransformer("standard_scaler")
    >>> transformer.fit(X)
    >>> transformer.transform(X)
    array([[-1., -1.],
              [ 1.,  1.]])
    """

    def __init__(self, transformer_type, tranformer_parameters=None):
        self.type = transformer_type
        self.parameters = tranformer_parameters
        self.transformer = self._init_transformer()

    def _init_transformer(self):
        """
        Initialize the transformer
        
        Returns
        -------
        transformer : sklearn transformer
            Transformer to use
        """
        if self.parameters is None:
            transformer = SUPPORTED_TRANSFORMERS[self.type]["function"]()
        else:
            transformer = SUPPORTED_TRANSFORMERS[self.type]["function"](**self.parameters)
        return transformer

    def fit(self, X):
        """
        Fit the transformer to the data
        
        Parameters
        ----------
        X : array-like, shape (n_samples, n_features)
            The data to fit the transformer to

        Returns
        -------
        None
        """
        self.transformer.fit(X)

    def transform(self, X):
        """
        Transform the data
        
        Parameters
        ----------
        X : array-like, shape (n_samples, n_features)
            The data to transform

        Returns
        -------
        X : array-like, shape (n_samples, n_features)
            The transformed data
        """
        return self.transformer.transform(X)

    def fit_transform(self, X):
        """
        Fit the transformer to the data and then transform it
        
        Parameters
        ----------
        X : array-like, shape (n_samples, n_features)
            The data to fit the transformer to and then transform

        Returns
        -------
        X : array-like, shape (n_samples, n_features)
            The transformed data
        """
        return self.transformer.fit_transform(X)

    def get_params(self):
        """
        Get the parameters of the transformer
        
        Returns
        -------
        params : dict
            Dictionary of parameters
        """
        return self.transformer.get_params()

    def set_params(self, **parameters):
        """
        Set the parameters of the transformer
        
        Parameters
        ----------
        **parameters : dict
            Dictionary of parameters

        Returns
        -------
        None
        """
        self.transformer.set_params(**parameters)