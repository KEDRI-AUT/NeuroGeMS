import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { sentenceCase } from 'change-case';
// import { faker } from '@faker-js/faker';
// @mui
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Container,
  FormControl,
  // FormControlLabel,
  Grid,
  IconButton,
  LinearProgress,
  MenuItem,
  Paper,
  Popover,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
  // Tooltip,
  Typography
} from '@mui/material';
import { LoadingButton, TimelineDot } from '@mui/lab';
// components
import Iconify from 'components/iconify';
import Scrollbar from 'components/scrollbar';
import Label from 'components/label';
// sections
import { TableListHead } from 'sections/@dashboard/table';
import { ModelAccuracy, ModelClassificationReport, ModelConfusionMatrix, ModelListToolbar } from 'sections/@dashboard/model';
// import { TrainingTimeline } from 'sections/@dashboard/experiment';
// utils
// import { usePersistentState } from 'utils/hooks';
import { get, post, requestHeader } from 'utils/requests';
// import fs from 'fs';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'indicator', label: '', alignRight: false },
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'created', label: 'Created', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'accuracy', label: 'Accuracy', alignRight: false },
  { id: 'precision', label: 'Precision', alignRight: false },
  { id: 'recall', label: 'Recall', alignRight: false },
  { id: 'f1Score', label: 'F1 Score', alignRight: false },
  { id: '' }
];

const CLASSIFICATION_REPORT_OPTIONS = [
  { value: 'classwise', label: 'Classwise' },
  { value: 'average', label: 'Average' }
];

const SHAP_OPTIONS = [
  { value: 'summary', label: 'Summary' },
  { value: 'feature_importance', label: 'Feature Importance' }
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array, (_user) => _user.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis.map((el) => el[0]);
}

function average(values) {
  return values.reduce((a, b) => a + b) / values.length;
}

function limitDecimalPlaces(number, places) {
  let value = Math.round(number * (10 ** places)) / (10 ** places);
  if (Number.isNaN(value)) {
    value = '-';
  }
  return value;
}

function formatDate(unixDate) {
  const date = new Date(unixDate);
  const day = String(date.getDate());
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear().toString().substring(-2);

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const formattedDate = `${hours}:${minutes}:${seconds} ${day} ${month} ${year}`;
  return formattedDate;
}

function chooseOption(id, options) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    const char = id.charCodeAt(i);
    hash += char;
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

function snakeToCamel(s) {
  return s.replace(/(_\w)/g, (m) => {
    return m[1].toUpperCase();
  });
}

function convertKeysToCamelCase(pyDict) {
  const jsDict = {};
  for (const key in pyDict) {
    if (pyDict.hasOwnProperty(key)) {
      const newKey = snakeToCamel(key);
      const value = pyDict[key];
      jsDict[newKey] = value;
    }
  }
  return jsDict;
}

// ----------------------------------------------------------------------

export default function ExperimentPage() {

  const theme = useTheme();

  // State variables
  const [alert, setAlert] = useState({ open: false, message: '', variant: 'info' });

  const [runs, setRuns] = useState([]);

  const [open, setOpen] = useState(null);

  const [popoverRow, setPopoverRow] = useState(null);

  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('desc');

  const [selectedRows, setSelectedRows] = useState([]);

  const [orderBy, setOrderBy] = useState('created');

  const [filterName, setFilterName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [runName, setRunName] = useState('');

  const [supportedValidations, setSupportedValidations] = useState([]);

  // const [validationType, setValidationType] = usePersistentState('', 'Experiment_validationType');
  const [validationType, setValidationType] = useState('');

  // const [validationParameters, setValidationParameters] = usePersistentState({}, 'Experiment_validationParameters');
  const [validationParameters, setValidationParameters] = useState({});

  const [validationParameterOptions, setValidationParameterOptions] = useState({});

  const [savedStrategies, setSavedStrategies] = useState([]);

  const [selectedStrategy, setSelectedStrategy] = useState('');

  // const [supportedMetrics, setSupportedMetrics] = useState([]);

  // const [selectedMetrics, setSelectedMetrics] = useState([]);

  const [training, setTraining] = useState(false);

  const [results, setResults] = useState({});

  const [classLabels, setClassLabels] = useState([]);

  const [metricsPlotType, setMetricsPlotType] = useState('classwise');

  const [shapPlotType, setShapPlotType] = useState('summary');

  const [imagePath, setImagePath] = useState(null);

  // Effect hooks
  useEffect(() => {
    let mounted = true;
    setTimeout(() => get(
      'get-supported-validations', // Route
      (response) => {
        if (mounted) {
          setSupportedValidations(response);
        }
      }, // Success callback
      (error) => console.error(error) // Error callback
    ), 1000);
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => get(
      'get-saved-strategies', // Route
      (response) => {
        if (mounted) {
          setSavedStrategies(response);
        }
      }, // Success callback
      (error) => console.error(error) // Error callback
    ), 1000);
    return () => { mounted = false; };
  }, []);

  // useEffect(() => {
  //   let mounted = true;
  //   setTimeout(() => get(
  //     'get-supported-metrics', // Route
  //     (response) => {
  //       if (mounted) {
  //         setSupportedMetrics(response);
  //       }
  //     }, // Success callback
  //     (error) => console.error(error) // Error callback
  //   ), 1000);
  //   return () => { mounted = false; };
  // }, []);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => get(
      'get-experiment-runs', // Route
      (response) => {
        if (mounted) {
          setRuns(response);
        }
      }, // Success callback
      (error) => console.error(error) // Error callback
    ), 1000);
    return () => { mounted = false; };
  }, [training]);

  useEffect(() => {
    // Fetch the image path dynamically, or use any other logic to change the imagePath.
    setImagePath(`/mlruns/${results.artifactUri}/shap_${shapPlotType}_plot.png`);
  }, [results, shapPlotType]);

  // Handlers
  const showAlert = (variant, message) => { setAlert({ open: true, message, variant });
    setTraining(false); };
  const handleAlertClose = () => { setAlert({ ...alert, open: false }); };

  const handleSelectValidationType = (event, newValidationType) => {
    setValidationType(newValidationType.id);
    setValidationParameters(
      Object.entries(newValidationType.params).reduce((param, [key, value]) => {
        param[key] = value[0] === null ? 'None' : value[0];
        return param;
      }, {})
    );
    setValidationParameterOptions(newValidationType.params);
    console.log(newValidationType.params);
  };

  const handleSelectValidationParameter = (event, newValidationParameter) => {
    setValidationParameters({
      ...validationParameters,
      [newValidationParameter.props.name]: newValidationParameter.props.value
    });
  };

  const handleSelectMetricsPlotType = (event) => {
    setMetricsPlotType(event.target.value);
  };

  const handleSelectShapPlotType = (event) => {
    setShapPlotType(event.target.value);
  };

  const handleTrainingResponse = (response) => {
    setResults({}); // Clear results. So that plots update properly.
    setClassLabels(response.labels);
    response.artifact_uri = response.artifact_uri.split('/mlruns/')[1];
    setImagePath(`/mlruns/${results.artifactUri}/shap_${shapPlotType}_plot.png`);
    setResults(convertKeysToCamelCase(response));
    setTraining(false);
    showAlert('success', 'Training complete!');
  };

  const handleTrainModel = () => {
    setTraining(true);
    const body = JSON.stringify({
      run_name: runName,
      strategy_name: selectedStrategy,
      validation: validationType,
      validation_parameters: validationParameters
    });
    setTimeout(() => post(
      body, // Body
      'train-strategy', // Route
      (response) => handleTrainingResponse(response), // Response callback
      (error) => console.error(error) // Error callback
    ), 1000);
  };

  const handleOpenMenu = (event, row) => {
    setOpen(event.currentTarget);
    setPopoverRow(row);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleViewResults = () => {
    setResults({});
    setClassLabels(JSON.parse(popoverRow.params.labels.replace(/'/g, '"')));
    const runResults = {};
    runResults.accuracy = popoverRow.metrics.accuracy;
    runResults.precision = JSON.parse(popoverRow.params.precision_classwise);
    runResults.recall = JSON.parse(popoverRow.params.recall_classwise);
    runResults.f1Score = JSON.parse(popoverRow.params.f1_score_classwise);
    runResults.confusionMatrix = JSON.parse(popoverRow.params.confusion_matrix);
    runResults.artifactUri = popoverRow.artifact_uri.split('/mlruns/')[1];
    setResults(runResults);

    handleCloseMenu();
  };

  const handleDeleteRun = () => {
    setTraining(true);
    setTimeout(() => get(
      `rm-run${requestHeader({ run_id: popoverRow.id })}`, // Route
      (response) => showAlert('success', response), // Success callback
      (error) => showAlert('error', error) // Error callback
    ), 1000);
    handleCloseMenu();
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelectedRows = runs.map((n) => n.id);
      setSelectedRows(newSelectedRows);
      return;
    }
    setSelectedRows([]);
  };

  const handleSelectClick = (event, name) => {
    const selectedIndex = selectedRows.indexOf(name);
    let newSelectedRows = [];
    if (selectedIndex === -1) {
      newSelectedRows = newSelectedRows.concat(selectedRows, name);
    } else if (selectedIndex === 0) {
      newSelectedRows = newSelectedRows.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows.length - 1) {
      newSelectedRows = newSelectedRows.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedRows = newSelectedRows.concat(selectedRows.slice(0, selectedIndex), selectedRows.slice(selectedIndex + 1));
    }
    setSelectedRows(newSelectedRows);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - runs.length) : 0;

  const filteredExperiments = applySortFilter(runs, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredExperiments.length && !!filterName;

  return (
    <>
      <Helmet>
        <title> Experiments | NeuroGeMS </title>
      </Helmet>

      <Snackbar
        anchorOrigin={ { horizontal: 'center', vertical: 'bottom' } }
        open={ alert.open }
        autoHideDuration={ 6000 }
        onClose={ handleAlertClose }
      >
        <Alert
          action={ (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={ handleAlertClose }
            >
              <Iconify icon="eva:close-fill" />
            </IconButton>
          ) }
          severity={ alert.variant }
          sx={ { mb: 3 } }
        >
          { alert.message }
        </Alert>
      </Snackbar>

      <Container>
        <Typography variant="h3" sx={ { mb: 5 } }>
          Experiments
        </Typography>

        <Grid container spacing={ 3 }>

          <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <Card>
              <CardHeader title="Setup" />
              <CardContent>
                <FormControl fullWidth>
                  <Typography variant="subtitle1" sx={ { color: theme.palette.text.secondary, pb: 2 } }>
                    Type:
                    <Chip label="Train Model" sx={ { bgcolor: theme.palette.mode === 'dark' ? 'error.darker' : 'error.lighter', ml: 1 } } />
                  </Typography>
                  <Autocomplete
                    disableClearable
                    required
                    id="strategy-selection"
                    options={ savedStrategies }
                    getOptionLabel={ (option) => option.name }
                    onChange={ (event, newStrategy) => setSelectedStrategy(newStrategy.name) }
                    sx={ { pb: 2 } }
                    renderInput={ (params) => <TextField { ...params } label="Model" /> }
                    isOptionEqualToValue={ (option, value) => option.name === value.name }
                  />
                  <TextField required id="run-name" label="Run Name" fullWidth sx={ { pb: 2 } } onChange={ (event) => setRunName(event.target.value) } />
                  <Grid item xs={ 12 } ms={ 12 } lg={ 12 } sx={ { border: 1, borderColor: theme.palette.divider, borderRadius: '10px', p: 2 } }>
                    <Typography variant="subtitle1" sx={ { color: theme.palette.text.secondary, pb: 2 } }>
                      Validation
                    </Typography>
                    <Autocomplete
                      disableClearable
                      required
                      id="validation-type-selection"
                      options={ supportedValidations }
                      getOptionLabel={ (option) => option.description }
                      onChange={ handleSelectValidationType }
                      sx={ { pb: 2 } }
                      renderInput={ (params) => <TextField { ...params } label="Type" /> }
                    />
                    { (validationType === undefined || validationType === '') ? (
                      <Typography variant="body2" sx={ { color: theme.palette.text.disabled, p: 1 } }>
                        Choose validation type to see parameters
                      </Typography>
                    ) : (
                      Object.keys(validationParameterOptions).length === 0 ? (
                        <Typography variant="body2" sx={ { color: theme.palette.text.disabled, p: 1 } }>
                          No parameters for this validation
                        </Typography>
                      ) : (
                        <Stack direction={ { xs: 'column', md: 'row' } }>
                          { Object.keys(validationParameterOptions).map((key) => (
                            <TextField
                              select
                              id={ `val-parameter-select-${key}` }
                              key={ `val-parameter-select-${key}` }
                              label={ key }
                              defaultValue={ validationParameterOptions[key][0] === null ? 'None' : validationParameterOptions[key][0] }
                              size="small"
                              sx={ { width: '30%', mr: 1, my: 1 } }
                              onChange={ handleSelectValidationParameter }
                            >
                              {validationParameterOptions[key].map((option) => (
                                <MenuItem key={ `select-option-${key}${option}` === null ? 'None' : option } value={ option === null ? 'None' : option } name={ key }>
                                  { option === true ? 'True' : option === false ? 'False' : option === null ? 'None' : option }
                                </MenuItem>
                              ))}
                            </TextField>
                            // validationParameterOptions[key] === 'number' ? (
                            //   <TextField
                            //     required
                            //     type="number"
                            //     id={ `val-parameter-select-${key}` }
                            //     key={ `val-parameter-select-${key}` }
                            //     label={ key }
                            //     size="small"
                            //     sx={ { width: '30%', mr: 2, my: 1 } }
                            //     onChange={ handleSelectValidationParameter }
                            //   />
                            // ) : (
                            //   validationParameterOptions[key] === 'boolean' ? (
                            //     <FormControlLabel
                            //       required
                            //       id={ `val-parameter-select-${key}` }
                            //       key={ `val-parameter-select-${key}` }
                            //       label={ key }
                            //       size="small"
                            //       control={ <Checkbox onChange={ handleSelectValidationParameter } /> }
                            //       sx={ { width: '30%', mr: 2, my: 1 } }
                            //     />
                            //   ) : (
                            //     validationParameterOptions[key] === 'decimal' ? (
                            //       <TextField
                            //         required
                            //         type="number"
                            //         id={ `val-parameter-select-${key}` }
                            //         key={ `val-parameter-select-${key}` }
                            //         label={ key }
                            //         size="small"
                            //         sx={ { width: '30%', mr: 2, my: 1 } }
                            //         onChange={ handleSelectValidationParameter }
                            //       />
                            //     ) : (
                            //       <TextField
                            //          select
                            //          required
                            //          id={ `val-parameter-select-${key}` }
                            //          key={ `val-parameter-select-${key}` }
                            //          label={ key }
                            //          defaultValue={ validationParameterOptions[key][0] === null ? 'None' : validationParameterOptions[key][0] }
                            //          size="small"
                            //          sx={ { width: '30%', mr: 1, my: 1 } }
                            //          onChange={ handleSelectValidationParameter }
                            //       >
                            //         {/* {validationParameterOptions[key].map((option) => (
                            //           <MenuItem key={ `select-option-${key}${option}` === null ? 'None' : option } value={ option === null ? 'None' : option } name={ key }>
                            //             { option === true ? 'True' : option === false ? 'False' : option === null ? 'None' : option }
                            //           </MenuItem>
                            //         ))} */}
                            //       </TextField>
                            //     )
                            //   )
                            // )
                          ))}
                        </Stack>
                      ))}
                  </Grid>
                  {/* <Autocomplete
                    multiple
                    id="metrics-selection"
                    options={ supportedMetrics }
                    disableCloseOnSelect
                    getOptionLabel={ (option) => option.name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }
                    groupBy={ (option) => option.type.charAt(0).toUpperCase() + option.type.slice(1) }
                    onChange={ (event, newMetrics) => setSelectedMetrics(newMetrics) }
                    sx={ { py: 2 } }
                    renderInput={ (params) => <TextField { ...params } label="Metrics" /> }
                    renderOption={ (props, option, { selected }) => (
                      <li { ...props }>
                        <Checkbox checked={ selected } />
                        <span>
                          { option.name.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') }
                        </span>
                        <Tooltip title={ option.description }>
                          <Iconify icon="eva:question-mark-circle-fill" sx={ { ml: 1 } } />
                        </Tooltip>
                      </li>
                    ) }
                  /> */}
                </FormControl>
              </CardContent>
            </Card>
            <LoadingButton variant="contained" sx={ { mt: 3, width: '100%' } } color="warning" size="large" onClick={ handleTrainModel } loading={ training } startIcon={ <Iconify icon="eva:play-circle-outline" /> }>
              Start
            </LoadingButton>
          </Grid>

          {/* <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <TrainingTimeline
              title="Progress"
              list={ [...Array(5)].map((_, index) => ({
                id: faker.datatype.uuid(),
                title: [
                  'Initializing Model',
                  'Training Model',
                  'Validating Model',
                  'Calculating Performance',
                  'Storing Results'
                ][index],
                type: `order${index + 1}`,
                time: faker.date.past()
              })) }
            />
          </Grid> */}

          <Grid item xs={ 12 } ms={ 12 } lg={ 12 }>
            <Card>
              { training
                ? <LinearProgress color="inherit" />
                : <div />}
              <CardHeader title="Runs" />
              <ModelListToolbar numSelected={ selectedRows.length } filterName={ filterName } onFilterName={ handleFilterByName } />
              <Scrollbar>
                <TableContainer sx={ { minWidth: 800 } }>
                  <Table>
                    <TableListHead
                      order={ order }
                      orderBy={ orderBy }
                      headLabel={ TABLE_HEAD }
                      rowCount={ runs.length }
                      numSelected={ selectedRows.length }
                      onRequestSort={ handleRequestSort }
                      onSelectAllClick={ handleSelectAllClick }
                    />
                    <TableBody>
                      {filteredExperiments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                        const { id, name, createdAt, status, metrics } = convertKeysToCamelCase(row);
                        const selectedExperiment = selectedRows.indexOf(name) !== -1;

                        return (
                          <TableRow hover key={ id } tabIndex={ -1 } role="checkbox" selected={ selectedExperiment } sx={ { px: 3 } }>
                            <TableCell padding="checkbox">
                              <Checkbox checked={ selectedExperiment } onChange={ (event) => handleSelectClick(event, id) } />
                            </TableCell>

                            <TableCell align="center">
                              <div style={ { display: 'inline-flex' } }>
                                <TimelineDot
                                  color={
                                    chooseOption(id, [
                                      'primary',
                                      'secondary',
                                      'success',
                                      'info',
                                      'warning',
                                      'error'
                                    ])
                                  }
                                  // sx={ { ml: 1 } }
                                />
                              </div>
                            </TableCell>

                            <TableCell component="th" scope="row">
                              <Stack direction="row" alignItems="center" spacing={ 2 }>
                                <Typography variant="subtitle2" noWrap>
                                  {name}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell align="left">{formatDate(createdAt)}</TableCell>

                            <TableCell align="left">
                              <Label color={ (status === 'FAILED' && 'error') || (status === 'RUNNING' && 'warning') || 'success' }>{sentenceCase(status)}</Label>
                            </TableCell>

                            <TableCell align="left">{limitDecimalPlaces(metrics.accuracy, 2)}</TableCell>

                            <TableCell align="left">{limitDecimalPlaces(metrics.precision, 4)}</TableCell>

                            <TableCell align="left">{limitDecimalPlaces(metrics.recall, 4)}</TableCell>

                            <TableCell align="left">{limitDecimalPlaces(metrics.f1_score, 4)}</TableCell>

                            <TableCell align="right">
                              <IconButton size="large" color="inherit" onClick={ (event) => handleOpenMenu(event, row) }>
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {emptyRows > 0 && (
                        <TableRow style={ { height: 53 * emptyRows } }>
                          <TableCell colSpan={ 6 } />
                        </TableRow>
                      )}
                    </TableBody>

                    {isNotFound && (
                      <TableBody>
                        <TableRow>
                          <TableCell align="center" colSpan={ 6 } sx={ { py: 3 } }>
                            <Paper
                              sx={ {
                                textAlign: 'center'
                              } }
                            >
                              <Typography variant="h6" paragraph>
                                Not found
                              </Typography>

                              <Typography variant="body2">
                                No results found for &nbsp;
                                <strong>
                                  &quot;
                                  {filterName}
                                  &quot;
                                </strong>
                                .
                                <br />
                                {' '}
                                Try checking for typos or using complete words.
                              </Typography>
                            </Paper>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    )}
                  </Table>
                </TableContainer>
              </Scrollbar>

              <TablePagination
                rowsPerPageOptions={ [5, 10, 25] }
                component="div"
                count={ runs.length }
                rowsPerPage={ rowsPerPage }
                page={ page }
                onPageChange={ handleChangePage }
                onRowsPerPageChange={ handleChangeRowsPerPage }
                sx={ { mx: 2, my: 1 } }
              />
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Card>
              <CardHeader title="Accuracy" />
              <CardContent>
                { results.accuracy === undefined || results.accuracy === null ? (
                  <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                    No results to display
                  </Typography>
                ) : (
                  <ModelAccuracy
                    chartData={ [results.accuracy] }
                    chartLabels={ ['Accuracy'] }
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <Card>
              <CardHeader title="Confusion Matrix" />
              <CardContent>
                { results.confusionMatrix === undefined || results.confusionMatrix === null ? (
                  <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                    No results to display
                  </Typography>
                ) : (
                  <ModelConfusionMatrix
                    chartData={ results.confusionMatrix }
                    chartLabels={ classLabels }
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <Card>
              <CardHeader
                title="Classification Report"
                action={ (
                  <TextField
                    select
                    id="metrics-plot-select"
                    defaultValue="classwise"
                    onChange={ handleSelectMetricsPlotType }
                    size="small"
                    sx={ {
                      '& .MuiInputBase-root': {
                        '& fieldset': {
                          borderWidth: 0
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: 0
                        },
                        '&:hover fieldset': {
                          borderWidth: 0
                        },
                        'background': theme.palette.background.natural,
                        'borderRadius': '5px'
                      }
                    } }
                  >
                    {CLASSIFICATION_REPORT_OPTIONS.map((option) => (
                      <MenuItem key={ `classification-report-select-option-${option.value}` } value={ option.value }>
                        { option.label }
                      </MenuItem>
                    ))}
                  </TextField>
                ) }
              />
              <CardContent>
                { results.precision === undefined || results.precision === null ? (
                  <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                    No results to display
                  </Typography>
                ) : (
                  metricsPlotType === 'classwise' ? (
                    <ModelClassificationReport
                      chartMetrics={ ['Precision', 'Recall', 'F1 Score'] }
                      chartData={ [results.precision, results.recall, results.f1Score] }
                      chartLabels={ classLabels }
                    />
                  ) : (
                    <ModelClassificationReport
                      average
                      chartLabels={ ['Precision', 'Recall', 'F1 Score'] }
                      chartData={ [
                        average(results.precision),
                        average(results.recall),
                        average(results.f1Score)
                      ] }
                    />
                  )
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <Card>
              <CardHeader
                title="SHAP Values"
                action={ (
                  <TextField
                    select
                    id="shap-plot-select"
                    defaultValue="summary"
                    onChange={ handleSelectShapPlotType }
                    size="small"
                    sx={ {
                      '& .MuiInputBase-root': {
                        '& fieldset': {
                          borderWidth: 0
                        },
                        '&.Mui-focused fieldset': {
                          borderWidth: 0
                        },
                        '&:hover fieldset': {
                          borderWidth: 0
                        },
                        'background': theme.palette.background.natural,
                        'borderRadius': '5px'
                      }
                    } }
                  >
                    {SHAP_OPTIONS.map((option) => (
                      <MenuItem key={ `shap-plot-select-option-${option.value}` } value={ option.value }>
                        { option.label }
                      </MenuItem>
                    ))}
                  </TextField>
                ) }
              />
              {/* <CardContent>
                { results.artifactUri === undefined || results.artifactUri === null || imagePath === null || imagePath === undefined ? (
                  <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                    No results to display
                  </Typography>
                ) : (
                  // shapPlotType === 'summary' ? (
                  //   // eslint-disable-next-line import/no-dynamic-require
                  //   <img src={ `/mlruns/${results.artifactUri}/shap_summary_plot.png` } alt="Summary Plot" />
                  // ) : (
                  //   // eslint-disable-next-line import/no-dynamic-require
                  //   <img src={ `/mlruns/${results.artifactUri}/shap_feature_importance_plot.png` } alt="Feature Importance Plot" />
                  // )
                  <img src={ imagePath } alt="SHAP Plot" />
                )}
              </CardContent> */}
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Popover
        open={ Boolean(open) }
        anchorEl={ open }
        onClose={ handleCloseMenu }
        anchorOrigin={ { vertical: 'top', horizontal: 'left' } }
        transformOrigin={ { vertical: 'top', horizontal: 'right' } }
        PaperProps={ {
          sx: {
            'p': 1,
            'width': 140,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75
            }
          }
        } }
      >
        <MenuItem onClick={ handleViewResults }>
          <Iconify icon="eva:eye-outline" sx={ { mr: 2 } } />
          View
        </MenuItem>

        <MenuItem onClick={ handleDeleteRun } sx={ { color: 'error.main' } }>
          <Iconify icon="eva:trash-2-outline" sx={ { mr: 2 } } />
          Delete
        </MenuItem>
      </Popover>
    </>
  );

}