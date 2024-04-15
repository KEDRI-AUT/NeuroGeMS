import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// @mui
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  FormControl,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
// components
import Iconify from 'components/iconify';
// utils
import { get, post, requestHeader } from 'utils/requests';

// ----------------------------------------------------------------------

EarlyFusionInput.propTypes = {
  strategyName: PropTypes.string.isRequired,
  setNodes: PropTypes.func.isRequired,
  setEdges: PropTypes.func.isRequired,
  showAlert: PropTypes.func.isRequired
};

// Returns the input form section for the early fusion strategy
export default function EarlyFusionInput({ strategyName, setNodes, setEdges, showAlert }) {
  const theme = useTheme();

  // State hooks
  const [modelName, setModelName] = useState('');

  const [modelType, setModelType] = useState('');

  const [modelParameters, setModelParameters] = useState({});

  const [modelParameterOptions, setModelParameterOptions] = useState({});

  const [supportedModels, setSupportedModels] = React.useState([]);

  const [loading, setLoading] = useState(false);

  // Effect hooks
  useEffect(() => {
    setTimeout(() => get(
      `get-supported-models${requestHeader({ strategy_name: strategyName })}`, // Route
      (response) => setSupportedModels(response), // Response callback
      (error) => console.error(error) // Error callback
    ), 1000);
  }, [strategyName]);

  // Helper functions
  const updateGraph = (response) => {
    setNodes(response.nodes);
    setEdges(response.edges);
    setLoading(false);
    showAlert('success', 'Strategy updated successfully');
  };

  // Event handlers
  const handleSelectModelType = (event, newModelType) => {
    setModelType(newModelType.id);
    setModelParameters(
      Object.entries(newModelType.params).reduce((param, [key, value]) => {
        param[key] = value[0] === null ? 'None' : value[0];
        return param;
      }, {})
    );
    setModelParameterOptions(newModelType.params);
  };

  const handleSelectModelParameter = (event, newModelParameter) => {
    setModelParameters({
      ...modelParameters,
      [newModelParameter.props.name]: newModelParameter.props.value
    });
  };

  const handleCreateModel = () => {
    setLoading(true);
    const body = JSON.stringify({
      strategy_name: strategyName,
      model_name: modelName,
      model_type: modelType,
      model_parameters: modelParameters
    });
    setTimeout(() => post(
      body, // Body
      'add-model-to-strategy', // Route
      (response) => updateGraph(response), // Response callback
      (error) => console.error(error) // Error callback
    ), 1000);
  };

  return (
    <Stack direction={ { xs: 'column', md: 'row' } } spacing={ { xs: 1, sm: 2, md: 4 } } sx={ { py: 2 } }>
      <FormControl fullWidth>
        <Grid item xs={ 12 } ms={ 12 } lg={ 12 } sx={ { border: 1, borderColor: theme.palette.divider, borderRadius: '10px', p: 3 } }>
          <TextField required id="outlined-required" label="Classifier Name" onChange={ (e) => setModelName(e.target.value) } />
          <Autocomplete
            disableClearable
            required
            id="model-type-selection"
            options={ supportedModels }
            groupBy={ (option) => option.group }
            getOptionLabel={ (option) => option.description }
            onChange={ handleSelectModelType }
            sx={ { mb: 1 } }
            renderInput={ (params) => <TextField { ...params } label="Classifier Type" margin="normal" /> }
          />
          <Typography variant="subtitle2" sx={ { color: theme.palette.text.secondary, pb: 2 } }>
            Classifier Parameters
          </Typography>
          { (modelType === undefined || modelType === '') ? (
            <Typography variant="body2" sx={ { color: theme.palette.text.disabled } }>
              Choose classifier type to see parameters
            </Typography>
          ) : (
            Object.keys(modelParameterOptions).map((key) => (
              <TextField
                select
                id={ `parameter-select-${key}` }
                key={ `parameter-select-${key}` }
                label={ key }
                defaultValue={ modelParameterOptions[key][0] }
                size="small"
                sx={ { width: '30%', mr: 1, my: 1 } }
                onChange={ handleSelectModelParameter }
              >
                {modelParameterOptions[key].map((option) => (
                  <MenuItem key={ `select-option-${key}${option}` === null ? 'None' : option } value={ option === null ? 'None' : option } name={ key }>
                    { option === true ? 'True' : option === false ? 'False' : option === null ? 'None' : option }
                  </MenuItem>
                ))}
              </TextField>
            ))
          )}
          <Box sx={ { display: 'flex', justifyContent: 'flex-end', mt: 2 } }>
            <LoadingButton variant="contained" onClick={ handleCreateModel } loading={ loading } loadingPosition="start" startIcon={ <Iconify icon="eva:checkmark-outline" /> }>
              Save
            </LoadingButton>
          </Box>
        </Grid>
      </FormControl>
    </Stack>
  );
}
