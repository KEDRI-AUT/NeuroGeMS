import numpy as np
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.utils.validation import check_X_y, check_array, check_is_fitted

from .pyESN import ESN



class ESNClassifier(BaseEstimator, ClassifierMixin):
    """
    Echo State Network classifier using the pyESN implementation. Each class is represented by a single output neuron.

    Echo State Networks are a type of recurrent neural network that uses a reservoir of randomly connected neurons to
    perform a nonlinear transformation of the input data. The output of the reservoir is then fed into a linear readout
    layer to perform the classification.

    Parameters:
    -----------
    n_reservoir : int, default=200
        The number of neurons in the reservoir.
    spectral_radius : float, default=0.95
        The spectral radius of the reservoir.
    sparsity : float, default=0
        The sparsity of the reservoir.
    noise : float, default=0.001
        The noise level of the reservoir.
    input_scaling : float, default=1.0
        The input scaling of the reservoir.
    teacher_forcing : bool, default=False
        Whether to use teacher forcing.
    feedback_scaling : float, default=0
        The feedback scaling of the reservoir.
    random_state : int, default=None
        The random seed to use for the reservoir.

    Attributes:
    -----------
    classes_ : np.ndarray
        The unique classes in the training data.
    encoder_ : OneHotEncoder
        The one-hot encoder used to encode the target data.
    n_outputs_ : int
        The number of output neurons.
    esn_ : ESN
        The ESN model.
        
    Methods:
    --------
    fit(X, y)
        Fit the ESN classifier to the given training data.
    predict(X)
        Predict the class labels for the given test data.
    
    Examples:
    ---------
    >>> from sklearn.datasets import load_iris
    >>> from sklearn.model_selection import train_test_split
    >>> from sklearn.metrics import accuracy_score
    >>> X, y = load_iris(return_X_y=True)
    >>> X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
    >>> clf = ESNClassifier(n_reservoir=200, spectral_radius=0.95, sparsity=0, noise=0.001, input_scaling=1.0, teacher_forcing=False, feedback_scaling=0, random_state=None)
    >>> clf.fit(X_train, y_train)
    >>> y_pred = clf.predict(X_test)
    >>> accuracy_score(y_test, y_pred)
    0.9736842105263158

    """

    def __init__(self, n_reservoir=200, spectral_radius=0.95, sparsity=0, 
                 noise=0.001, input_scaling=1.0, teacher_forcing=False, 
                 feedback_scaling=0, random_state=None):
        self.n_reservoir = n_reservoir
        self.spectral_radius = spectral_radius
        self.sparsity = sparsity
        self.noise = noise
        self.input_scaling = input_scaling
        self.teacher_forcing = teacher_forcing
        self.feedback_scaling = feedback_scaling
        self.random_state = random_state
        
    def fit(self, X, y):
        """
        Fit the ESN classifier to the given training data.
        
        Parameters:
        -----------
        X : np.ndarray
            The training data.
        y : np.ndarray
            The target data.

        Returns:
        --------
        self : ESNClassifier
            The fitted ESN classifier.
        """

        # Check that X and y have correct shape
        X, y = check_X_y(X, y)

        # Store the classes seen during fit
        self.classes_, y = np.unique(y, return_inverse=True)
        self.n_outputs_ = len(self.classes_)
        
        # Encode the target data
        from sklearn.preprocessing import OneHotEncoder
        self.encoder_ = OneHotEncoder()
        y_onehot = self.encoder_.fit_transform(y.reshape(-1, 1)).toarray()
        
        # Fit the ESN model
        self.esn_ = ESN(n_inputs=X.shape[1], n_outputs=self.n_outputs_, 
                        n_reservoir=self.n_reservoir, spectral_radius=self.spectral_radius, 
                        sparsity=self.sparsity, noise=self.noise, input_scaling=self.input_scaling, 
                        teacher_forcing=self.teacher_forcing, feedback_scaling=self.feedback_scaling, 
                        random_state=self.random_state)
        self.esn_.fit(X, y_onehot)

        # Return the classifier
        return self
    
    def predict(self, X):
        """
        Predict the class labels for the given test data.

        Parameters:
        -----------
        X : np.ndarray
            The test data.

        Returns:
        --------
        y_pred : np.ndarray
            The predicted class labels.
        """
        # Check is fit had been called
        check_is_fitted(self, ['esn_'])

        # Input validation
        X = check_array(X)

        # Predict the class labels
        y_pred = self.esn_.predict(X)
        
        # Return the predicted class labels
        return self.classes_[np.argmax(y_pred, axis=1)]

    def predict_proba(self, X):
        """
        Predict the class probabilities for the given test data.

        Parameters:
        -----------
        X : np.ndarray
            The test data.

        Returns:
        --------
        proba : np.ndarray
            The predicted class probabilities.
        """
        # Check is fit had been called
        check_is_fitted(self, ['esn_'])

        # Input validation
        X = check_array(X)

        # Predict the class probabilities
        y_pred = self.esn_.predict(X)
        proba = y_pred / np.sum(y_pred, axis=1)[:, np.newaxis]

        # Return the predicted class probabilities
        return proba

