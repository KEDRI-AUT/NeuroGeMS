import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, ClassifierMixin
from sklearn.feature_selection import chi2, f_classif, mutual_info_classif
from sklearn.preprocessing import LabelEncoder
from sklearn.utils.validation import check_X_y, check_array, check_is_fitted


class WWKNNClassifier(BaseEstimator, ClassifierMixin):
    """
    K-nearest neighbors classifier with optional support for weighted voting, per-class nearest neighbors, and
    weighted distance calculation based on feature importance.
    
    Parameters
    ----------
    n_neighbors : int, default=5
        Number of nearest neighbors to consider.
    weights : str, default='uniform'
        Weight function used in prediction. Possible values:
        - 'uniform': all neighbors have equal weight.
        - 'distance': weight is proportional to the inverse of the distance.
    per_class : bool, default=False
        If True, choose k nearest neighbors from each class.
    feature_importance : str or None, default=None
        Filter feature selection method used to calculate feature importance. Possible values:
        - 'f_classif': ANOVA F-value between label/feature for classification tasks.
        - 'mutual_info_classif': Mutual information between each feature and the target for classification tasks.
        - 'chi2': Chi-squared stats between each non-negative feature and class for classification tasks.
        - None: all features have equal importance.

    Attributes
    ----------
    X_ : array-like of shape (n_samples, n_features)
        Training input samples.
    y_ : array-like of shape (n_samples,)
        Target values.
    classes_ : ndarray of shape (n_classes,)
        Unique class labels.
    feature_importances_ : array-like of shape (n_features,)
        Importance of each feature. Used for weighted distance calculation.
    label_encoder_ : sklearn.preprocessing.LabelEncoder or None
        Label encoder used to encode string labels.
    
    Methods
    -------
    fit(X, y)
        Fit the KNN classifier to the given training data.

    predict(X)
        Predict the class labels for the given test data.

    Notes
    -----
    This implementation uses `np.argpartition` to find the k nearest neighbors, which can be faster than `np.argsort`
    for large datasets and small k.

    Examples
    --------
    >>> from sklearn.datasets import load_iris
    >>> from sklearn.model_selection import train_test_split
    >>> from sklearn.metrics import accuracy_score
    >>> X, y = load_iris(return_X_y=True)
    >>> X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=0)
    >>> clf = KNN(n_neighbors=3, weights='distance', per_class=True, feature_importance='mutual_info_classif')
    >>> clf.fit(X_train, y_train)
    KNN(feature_importance='mutual_info_classif', n_neighbors=3, per_class=True, weights='distance')
    >>> y_pred = clf.predict(X_test)
    >>> accuracy_score(y_test, y_pred)
    0.9777777777777777

    """

    def __init__(self, n_neighbors=5, weights='uniform', per_class=False, feature_importance=None):
        self.n_neighbors = n_neighbors
        self.weights = weights
        self.per_class = per_class
        self.feature_importance = feature_importance

    def fit(self, X, y):
        """
        Fit the KNN model to the training data.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Training input samples.
        y : array-like of shape (n_samples,)
            Target values.

        Returns
        -------
        self : KNN
            The fitted estimator.
        """
        # Check that X and y have correct shape
        X, y = check_X_y(X, y)

        # Store class labels
        self.classes_ = np.unique(y)

        # Convert data to numpy arrays and encode string labels
        if isinstance(X, pd.DataFrame):
            X = X.values
        if isinstance(y, pd.Series):
            y = y.values
        if isinstance(y[0], str):
            self.label_encoder_ = LabelEncoder()
            self.label_encoder_.fit(y)
            y = self.label_encoder_.transform(y)
        else:
            self.label_encoder_ = None

        # Store training data
        self.X_ = X
        self.y_ = y

        # Calculate feature importance scores
        if self.feature_importance == 'f_classif':
            _, self.feature_importances_ = f_classif(X, y)
        elif self.feature_importance == 'mutual_info_classif':
            self.feature_importances_ = mutual_info_classif(X, y)
        elif self.feature_importance == 'chi2':
            _, self.feature_importances_ = chi2(X, y)
        else:
            self.feature_importances_ = np.ones(X.shape[1])

        return self

    def predict(self, X):
        """
        Predict the class labels for the given test data.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Test input samples.

        Returns
        -------
        y_pred : ndarray of shape (n_samples,)
            Predicted class labels.
        """

        y_prob = self.predict_proba(X)
        return self.classes_[np.argmax(y_prob, axis=1)]

    def predict_proba(self, X):
        """
        Predict the class probabilities for the given test data.

        Parameters
        ----------
        X : array-like of shape (n_samples, n_features)
            Test input samples.

        Returns
        -------
        y_prob : ndarray of shape (n_samples, n_classes)
            Predicted class probabilities.
        """
        # Check that X has correct shape
        X = check_array(X)

        # Check that fit has been called
        check_is_fitted(self)

        # Convert data to numpy array
        if isinstance(X, pd.DataFrame):
            X = X.values

        y_prob = np.empty((X.shape[0], len(self.classes_)))

        for i, x in enumerate(X):
            # Calculate weighted distances to training data
            distances = np.linalg.norm(np.multiply((self.X_ - x), self.feature_importances_), axis=1)

            if self.per_class:
                # Choose k nearest neighbors from each class
                nearest_neighbor_indices = []
                for c in range(len(self.classes_)):
                    c_indices = np.where(self.y_ == c)[0]
                    c_distances = distances[c_indices]
                    c_nearest_neighbor_indices = c_indices[np.argpartition(c_distances, self.n_neighbors)[:self.n_neighbors]]
                    nearest_neighbor_indices.extend(c_nearest_neighbor_indices)
            else:
                # Choose the overall k nearest neighbors
                nearest_neighbor_indices = np.argpartition(distances, self.n_neighbors)[:self.n_neighbors]

            nearest_neighbor_labels = self.y_[nearest_neighbor_indices]
            
            # Predict the class probabilities
            if self.weights == 'uniform':
                y_prob[i] = np.bincount(nearest_neighbor_labels, minlength=len(self.classes_)) / self.n_neighbors
            else:
                weights = 1.0 / distances[nearest_neighbor_indices]
                y_prob[i] = np.bincount(nearest_neighbor_labels, weights=weights, minlength=len(self.classes_)) / np.sum(weights)

        return y_prob
