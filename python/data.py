import pandas as pd
from ydata_profiling import ProfileReport
import json
import sys

class DataHandler():

    def __init__(self):
        """
        Initializes the data handler

        Parameters
        ----------
        None

        Returns
        -------
        None

        """
        self.datasets = {}

    def add_dataset(self, dataset_name, dataset_path, label_column, time_column=None):
        """
        Adds a new dataset to the collection

        Parameters
        ----------
        dataset_name : str
            The name of the dataset
        dataset_path : str
            The path to the dataset
        label_column : str
            The name of the label column

        Returns
        -------
        dict
            The dataset information

        """
        if time_column is not None:
            dataset = TimeSeriesDataset(dataset_name, dataset_path, label_column, time_column)
        else:
            dataset = Dataset(dataset_name, dataset_path, label_column)
        self.datasets[dataset_name] = dataset
        
    def get_dataset(self, dataset_name):
        """
        Returns the Dataset object for the given dataset name
        
        Parameters
        ----------
        dataset_name : str
            The name of the dataset to return
            
        Returns
        -------
        Dataset
            The Dataset object
            
        Raises
        ------
        KeyError
            If the dataset name is not found
                
        """
        if dataset_name not in self.datasets:
            raise KeyError("Dataset not found")

        return self.datasets[dataset_name]

    
    def get_dataset_information(self, dataset_name, return_profile=False):
        """
        Returns the dataset information for the given dataset name

        Parameters
        ----------
        dataset_name : str
            The name of the dataset to return

        return_profile : bool, default=False
            Whether to include the dataset profile in the returned information

        Returns
        -------
        dict
            The dataset information

        Raises
        ------
        KeyError
            If the dataset name is not found

        """
        if dataset_name not in self.datasets:
            raise KeyError("Dataset not found:" + dataset_name)

        return self.datasets[dataset_name].get_information(return_profile)

    def get_datasets_information(self, return_profile=False):
        """
        Returns the dataset information for all datasets

        Parameters
        ----------
        return_profile : bool, default=False
            Whether to include the dataset profile in the returned information

        Returns
        -------
        list
            The list of dataset information

        """
        return [self.get_dataset_information(dataset_name, return_profile) for dataset_name in self.datasets]

    def rm_dataset(self, dataset_name):
        """
        Removes the dataset from the collection

        Parameters
        ----------
        dataset_name : str
            The name of the dataset to remove

        Returns
        -------
        None

        Raises
        ------
        KeyError
            If the dataset name is not found

        """
        if dataset_name not in self.datasets:
            raise KeyError("Dataset not found")

        self.datasets.pop(dataset_name)

    def rm_all_datasets(self):
        """
        Removes all datasets from the collection

        Parameters
        ----------
        None

        Returns
        -------
        None

        """
        self.datasets = {}

    @property
    def dataset_names(self):
        """
        Returns a list of all dataset names

        Parameters
        ----------
        None

        Returns
        -------
        list
            The list of all dataset names

        """
        return list(self.datasets.keys())

    @property
    def dataset_count(self):
        """
        Returns the number of datasets in the collection

        Parameters
        ----------
        None

        Returns
        -------
        int
            The number of datasets in the collection

        """
        return len(self.datasets)

    @property
    def datasets_information(self):
        """
        Returns the dataset information for all datasets

        Parameters
        ----------
        None

        Returns
        -------
        list
            The list of dataset information

        """
        return self.get_datasets_information()


class Dataset():
    def __init__(self, name, path, target_column):
        """
        Initializes the dataset

        Parameters
        ----------
        name : str
            The name of the dataset

        path : str
            The path to the dataset

        target_column : str
            The name of the target column

        Returns
        -------
        None
        """
        self.name = name
        self.path = path
        self.data = self._load_data(path)
        self.target_column = self._check_target_column(target_column)
        self.description = str(self.data.shape[0]) + " rows, " + str(self.data.shape[1]) + " columns | " + "{:.1f}".format(self.data.memory_usage().sum() / 1024 / 1024) + " MB"  # TODO: format file size in a better way
        self.profile = self._generate_profile(self.data, name)

    def _load_data(self, path):
        """
        Loads the dataset from the given path
        
        Parameters
        ----------
        path : str
            The path to the dataset

        Returns
        -------
        pandas.DataFrame
            The loaded dataset

        Raises
        ------
        Exception
            If the dataset could not be loaded
        """
        try:
            return pd.read_csv(path)
        except:
            raise Exception("Could not load dataset at: " + path + "\n because of the following error: " + sys.exc_info()[0])

    def _check_target_column(self, target_column):
        """
        Checks if the target column is in the dataset
        
        Parameters
        ----------
        target_column : str
            The name of the target column
            
        Returns
        -------
        str
            The name of the target column

        Raises
        ------
        Exception
            If the target column is not in the dataset
        """
        if target_column not in self.data.columns:
            raise Exception("Target column not found in dataset: " + self.name)

        return target_column

    def _generate_profile(self, data, name):
        """
        Generates a profile for the dataset

        Parameters
        ----------
        data : pandas.DataFrame
            The dataset to generate the profile for

        name : str
            The name of the dataset

        Returns
        -------
        dict
            The dataset profile

        Raises
        ------
        Exception
            If the profile could not be generated
        """

        try:
            return json.loads(ProfileReport(data, title=name, minimal=True).to_json().replace(" NaN", " null"))
        except:
            raise Exception("Could not generate profile for dataset: " + name)

    def get_data(self, drop_target=False):
        """
        Returns the dataset

        Parameters
        ----------
        drop_target : bool, default=False
            Whether to drop the target column from the dataset

        Returns
        -------
        pandas.DataFrame
            The dataset
        """
        if drop_target:
            return self.data.drop(self.target_column, axis=1)

        return self.data

    def get_target(self):
        """
        Returns the target column

        Parameters
        ----------
        None

        Returns
        -------
        pandas.Series
            The target column
        """
        return self.data[self.target_column]

    def get_information(self, return_profile=False):
        """
        Returns the dataset information
        
        Parameters
        ----------
        return_profile : bool, default=False
            Whether to include the dataset profile in the returned information

        Returns
        -------
        dict
            The dataset information
        """
        information = {
            "name": self.name,
            "path": self.path,
            "target_column": self.target_column,
            "description": self.description
        }

        if return_profile:
            information["profile"] = self.profile

        return information

class TimeSeriesDataset():
    def __init__(self, name, path, target_column, time_column):
        """
        Initializes the time series dataset

        Parameters
        ----------
        name : str
            The name of the dataset

        path : str
            The path to the dataset

        target_column : str
            The name of the target column

        time_column : str
            The name of the time column

        Returns
        -------
        None
        """
        self.name = name
        self.path = path
        self.data = self._load_data(path)
        self.target_column = self._check_target_column(target_column)
        self.time_column = self._check_time_column(time_column)
        self.description = str(self.data.shape[0]) + " rows, " + str(self.data.shape[1]) + " columns | " + "{:.1f}".format(self.data.memory_usage().sum() / 1024 / 1024) + " MB"  # TODO: format file size in a better way
        self.profile = self._generate_profile(self.data, name)

    def _load_data(self, path):
        """
        Loads the dataset from the given path
        
        Parameters
        ----------
        path : str
            The path to the dataset

        Returns
        -------
        pandas.DataFrame
            The loaded dataset

        Raises
        ------
        Exception
            If the dataset could not be loaded
        """
        try:
            return pd.read_csv(path)
        except:
            raise Exception("Could not load dataset at: " + path + "\n because of the following error: " + sys.exc_info()[0])

    def _check_target_column(self, target_column):
        """
        Checks if the target column is in the dataset
        
        Parameters
        ----------
        target_column : str
            The name of the target column
            
        Returns
        -------
        str
            The name of the target column

        Raises
        ------
        Exception
            If the target column is not in the dataset
        """
        if target_column not in self.data.columns:
            raise Exception("Target column not found in dataset: " + self.name)

        return target_column

    def _check_time_column(self, time_column):
        """
        Checks if the time column is in the dataset
        
        Parameters
        ----------
        time_column : str
            The name of the time column
            
        Returns
        -------
        str
            The name of the time column
        """
        if time_column not in self.data.columns:
            raise Exception("Time column not found in dataset: " + self.name)

        return time_column
    
    def _generate_profile(self, data, name):
        """
        Generates a profile for the dataset

        Parameters
        ----------
        data : pandas.DataFrame
            The dataset to generate the profile for

        name : str
            The name of the dataset

        Returns
        -------
        dict
            The dataset profile

        Raises
        ------
        Exception
            If the profile could not be generated
        """

        try:
            return json.loads(ProfileReport(data, tsmode=True, sortby=self.time_column, title=name, minimal=True).to_json().replace(" NaN", " null"))
        except:
            raise Exception("Could not generate profile for dataset: " + name)
        
    def get_data(self, drop_target=False):
        """
        Returns the dataset

        Parameters
        ----------
        drop_target : bool, default=False
            Whether to drop the target column from the dataset

        Returns
        -------
        pandas.DataFrame
            The dataset
        """
        if drop_target:
            return self.data.drop(self.target_column, axis=1)

        return self.data
    
    def get_target(self):
        """
        Returns the target column

        Parameters
        ----------
        None

        Returns
        -------
        pandas.Series
            The target column
        """
        return self.data[self.target_column]
    
    def get_time(self):
        """
        Returns the time column

        Parameters
        ----------
        None

        Returns
        -------
        pandas.Series
            The time column
        """
        return self.data[self.time_column]
    
    def get_information(self, return_profile=False):
        """
        Returns the dataset information
        
        Parameters
        ----------
        return_profile : bool, default=False
            Whether to include the dataset profile in the returned information

        Returns
        -------
        dict
            The dataset information
        """
        information = {
            "name": self.name,
            "path": self.path,
            "target_column": self.target_column,
            "time_column": self.time_column,
            "description": self.description
        }

        if return_profile:
            information["profile"] = self.profile

        return information
