import sys
from flask import Flask, jsonify, request
from flask_cors import CORS
from python import DataHandler, StrategyHandler, ExperimentHandler
import mlflow

app = Flask(__name__)
app_config = {"host": "0.0.0.0", "port": sys.argv[1]}

data_handler = DataHandler()
strategy_handler = StrategyHandler()
experiment_handler = ExperimentHandler(strategy_handler)

"""
---------------------- DEVELOPER MODE CONFIG -----------------------
"""
# Developer mode uses app.py
if "app.py" in sys.argv[0]:
  # Update app config
  app_config["debug"] = True

  # CORS settings
  cors = CORS(
    app,
    resources={r"/*": {"origins": "http://localhost*"}},
  )

  # CORS headers
  app.config["CORS_HEADERS"] = "Content-Type"


"""
--------------------------- REST CALLS -----------------------------
"""
# Remove and replace with your own
@app.route("/example")
def example():
  """Example Flask route."""
  # See /src/components/App.js for frontend call
  return jsonify("Example response from Flask! Learn more in /app.py & /src/components/App.js")

"""
----------- DATA ------------
"""
# Add new dataset
@app.route("/add-dataset")
def add_dataset():
  """Adds a new dataset to the collection"""
  # Get arguments
  name = request.args.get("name")
  path = request.args.get("path")
  target_column = request.args.get("target_column")
  time_column = request.args.get("time_column", None)
  return_information = request.args.get("return_information", False)
  return_profile = request.args.get("return_profile", False)

  # Logging
  print(f"Adding Dataset... \nName: {name} \nPath: {path} \nTarget Column: {target_column} \nTime Column: {time_column}")

  # Add dataset
  try:
    data_handler.add_dataset(name, path, target_column, time_column)
  except Exception as e:
    return jsonify(str(e))

  print(data_handler.get_datasets_information())
  
  # Return dataset information
  if return_information:
    try:
      return jsonify(data_handler.get_dataset_information(name, return_profile))
    except Exception as e:
      return jsonify(str(e))

# Get datasets information
@app.route("/get-datasets-information")
def get_datasets_information():
  """Returns a list containing information of all the datasets in the collection"""
  # Get arguments
  return_profile = request.args.get("return_profile", False)

  # Return datasets information
  try:
    return jsonify(data_handler.get_datasets_information(return_profile))
  except Exception as e:
    return jsonify(str(e))

# Remove dataset
@app.route("/rm-dataset")
def rm_dataset():
  """Removes a dataset from the collection"""
  # Get arguments
  name = request.args.get("name")

  try:
    data_handler.rm_dataset(name)
  except Exception as e:
    return jsonify(str(e))

  # Return success message
  return jsonify("Dataset removed successfully!")

"""
----------- MODEL ------------
"""
# Get supported strategies
@app.route("/get-supported-strategies")
def get_supported_strategies():
  """Returns a list containing information of all the supported strategies"""
  return jsonify(strategy_handler.get_supported_strategies_information())

# Get supported validation methods
@app.route("/get-supported-validations")
def get_supported_validations():
  """Returns a list containing information of all the supported validation methods"""
  return jsonify(strategy_handler.get_supported_validations_information())

# Get saved strategies
@app.route("/get-saved-strategies")
def get_saved_strategies():
  """Returns a list containing information of all the saved strategies"""
  return jsonify(strategy_handler.get_saved_strategies_information())

# Get supported metrics
@app.route("/get-supported-metrics")
def get_supported_metrics():
  """Returns a list containing information of all the supported metrics"""
  return jsonify(experiment_handler.get_supported_metrics_information())

# Get supported models
@app.route("/get-supported-models")
def get_supported_models():
  """Returns a list containing information of all the supported models"""
  # Get arguments
  strategy_name = request.args.get("strategy_name")

  # Return supported models
  return jsonify(strategy_handler.get_supported_models_information(strategy_name))

# Create strategy
@app.route("/create-strategy")
def create_strategy():
  """Creates a new strategy"""
  # Get arguments
  strategy_name = request.args.get("strategy_name")
  strategy_type = request.args.get("strategy_type")

  # Create strategy
  try:
    strategy_handler.add_strategy(strategy_name, strategy_type, data_handler)
  except Exception as e:
    return jsonify(str(e))

  # Return success message
  return jsonify("Strategy created successfully!")

# Remove strategy
@app.route("/rm-strategy")
def rm_strategy():
  """Removes a strategy"""
  # Get arguments
  strategy_name = request.args.get("strategy_name")

  # Remove strategy
  strategy_handler.remove_strategy(strategy_name)

  # Return success message
  return jsonify("Model deleted successfully!")

# Add model
@app.route("/add-model-to-strategy", methods=["POST"])
def add_model_to_strategy():
  """Adds a new model to the strategy"""
  # Get arguments
  request_data = request.get_json()
  strategy_name = request_data["strategy_name"]
  model_name = request_data["model_name"]
  model_type = request_data["model_type"]
  if "model_parameters" in request_data:
    model_parameters = request_data["model_parameters"]
  else:
    print(request_data)
    model_parameters = None

  # Add model
  if "model_input" in request_data:
    model_input = request_data["model_input"]
  else:
    model_input = None

  try:
    strategy_handler.add_model(
      strategy_name,
      model_name,
      model_type,
      model_parameters,
      model_input
    )
  except Exception as e:
    return jsonify(str(e))

  # Return strategy graph
  return jsonify(strategy_handler.get_strategy_graph(strategy_name))


# Train strategy
@app.route("/train-strategy", methods=["POST"])
def train_strategy():
  """Trains the strategy"""
  request_data = request.get_json()
  run_name = request_data["run_name"]
  strategy_name = request_data["strategy_name"]
  validation = request_data["validation"]
  validation_parameters = request_data["validation_parameters"]
  validation_parameters = {k: None if v == "None" else v for k, v in validation_parameters.items()}

  # try:
  training_results = strategy_handler.train_strategy(run_name, strategy_name, validation, validation_parameters)
  # except Exception as e:
  #   return jsonify(str(e)), 500

  return jsonify(training_results)

# Get strategy requirements
@app.route("/get-strategy-requirements")
def get_strategy_requirements():
  """Returns the requirements of the strategy"""
  # Get arguments
  strategy_name = request.args.get("strategy_name")

  # Return strategy requirements
  return jsonify(strategy_handler.get_strategy_requirements(strategy_name))

# Run Experiment
@app.route("/run-experiment", methods=["POST"])
def run_experiment():
  """Runs an experiment"""
  # Get arguments
  request_data = request.get_json()
  experiment_name = request_data["name"]
  experiment_type = request_data["type"]
  experiment_parameters = request_data["parameters"]
  experiment_metrics = request_data["metrics"]

  # Run experiment
  try:
    experiment_results = experiment_handler.run_experiment(experiment_name, experiment_type, experiment_parameters, experiment_metrics)
  except Exception as e:
    return jsonify(str(e))

  # Return experiment results
  return jsonify(experiment_results)

# Delete experiment run
@app.route("/rm-run")
def rm_run():
  """Removes an experiment run"""
  # Get arguments
  run_id = request.args.get("run_id")
  # Remove experiment
  mlflow.delete_run(run_id)
  # Return success message
  return jsonify("Experiment run deleted successfully!")

# Get experiment runs
@app.route("/get-experiment-runs")
def get_experiment_runs():
  """Returns the experiment runs"""
  # Return experiment runs
  return jsonify(experiment_handler.get_experiment_runs())


"""
-------------------------- APP SERVICES ----------------------------
"""
# Quits Flask on Electron exit
@app.route("/quit")
def quit():
  shutdown = request.environ.get("werkzeug.server.shutdown")
  shutdown()

  return

if __name__ == "__main__":
  app.run(**app_config)
