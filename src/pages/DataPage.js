import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
// @mui
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardHeader,
  CardContent,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  Snackbar,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableContainer,
  TextField,
  Typography
} from '@mui/material';
import {
  red,
  green,
  blue,
  yellow,
  orange,
  purple,
  pink,
  grey,
  indigo,
  teal,
  cyan,
  lime,
  deepOrange,
  deepPurple,
  lightBlue,
  lightGreen,
  amber
} from '@mui/material/colors';
import { LoadingButton } from '@mui/lab';
// components
import Iconify from 'components/iconify';
// utils
import { get, requestHeader } from 'utils/requests';
// sections
import { FeatureVizPlot, ClassLabels } from 'sections/@dashboard/data';

// ----------------------------------------------------------------------

const DATA_STATS_KEYS = ['n', 'n_var', 'n_cells_missing', 'p_cells_missing', 'memory_size', 'record_size'];
const DATA_STATS_LABELS = ['Number of Observations', 'Number of Variables', 'Missing Cells', 'Missing Cell (%)', 'Size in Memory', 'Average Record Size in Memory'];
const DATA_VARS_KEYS = ['Numerical', 'Categorical', 'Text', 'Date', 'Datetime', 'Boolean', 'Constant', 'Unique', 'Rejected'];
const NUMERIC_STATS_KEYS = ['mean', 'std', 'min', 'max', 'kurtosis', 'skewness'];
const NUMERIC_STATS_LABELS = ['Mean', 'Standard Deviation', 'Minimum', 'Maximum', 'Kurtosis', 'Skewness'];
const CATEGORICAL_STATS_KEYS = ['n_distinct', 'n_missing', 'p_missing', 'imbalance'];
const CATEGORICAL_STATS_LABELS = ['Number of Distinct Values', 'Missing Values', 'Missing Values (%)', 'Imbalance'];


function formatProfile(profile) {
  profile.table.p_cells_missing = `${(profile.table.p_cells_missing * 100).toFixed(2)}%`;
  profile.table.memory_size = `${(profile.table.memory_size / 1024 / 1024).toFixed(1)} MB`;
  profile.table.record_size = `${(profile.table.record_size / 1024).toFixed(1)} KB`;
  return profile;
}

function formatProfilesInResponse(response) {
  if (!response || response.length === 0) {
    return [];
  }
  return response.map((item) => {
    return {
      ...item,
      profile: formatProfile(item.profile)
    };
  });
}

function limitDecimalPlaces(number, places) {
  return Math.round(number * (10 ** places)) / (10 ** places);
}

function roundToNearest(num, interval) {
  return Math.round(num / interval) * interval;
}

function generateShades(color, numShades) {
  const shades = [];
  const interval = 700 / numShades;
  for (let i = 1; i <= numShades; i += 1) {
    const shade = color[roundToNearest(i * interval, 100)];
    shades.push(shade);
  }
  return shades;
}

function reduceArithmeticProgression(arr) {
  // Check if array has more than 2 elements
  if (arr.length < 3) {
    return [ arr[0] + arr[arr.length - 1] / 2 ];
  }

  const a0 = arr[0];
  const aN = arr[arr.length - 1];
  const N = arr.length;
  const dNew = (aN - a0) / (N - 2); // new common difference

  const newArr = [];
  for (let i = 0; i < N - 1; i += 1) {
    newArr.push(a0 + i * dNew);
  }

  return newArr;
}

// ----------------------------------------------------------------------

export default function DataPage() {

  const theme = useTheme();

  // State variables
  const [tab, setTab] = useState(0);

  const [showSkeleton, setShowSkeleton] = useState(true);

  const [alert, setAlert] = useState({ open: false, message: '', variant: 'info' });

  const [datasets, setDatasets] = useState([]);

  const [feature, setFeature] = useState('');

  const [loading, setLoading] = useState(false);

  // Dialog state variables
  const [inputDatasetName, setInputDatasetName] = useState('');
  const [inputTargetColumn, setInputTargetColumn] = useState('');
  const [inputFile, setInputFile] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  // Handlers
  const handleTabChange = (event, newTab) => {
    setFeature('');
    setTab(newTab);
  };

  const handleDatasetsResponse = (response) => {
    if (datasets.length === 0) {
      setShowSkeleton(false);
    }
    setDatasets(formatProfilesInResponse(response));
  };

  const showAlert = (variant, message) => { setAlert({ open: true, message, variant }); };
  const handleAlertClose = () => { setAlert({ ...alert, open: false }); };

  const handleDialogOpen = () => {
    setDialogOpen(true);
    // setInputDatasetName('Dataset#'.concat(datasets.length));
    // setInputTargetColumn('Status');
  };

  const handleDialogClose = () => { setDialogOpen(false); };

  const handleDialogResponse = (response) => {
    response.profile = formatProfile(response.profile);
    setDatasets((current) => [...current, response]);
    setLoading(false);
    showAlert('success', 'Dataset added successfully.');
    handleDialogClose();
    setTab(datasets.length);
  };

  const handleSelectFeature = (event, newFeature) => { setFeature(newFeature); };

  const handleNewData = () => {
    // showAlert('info', 'New data is being processed. Please wait.');
    setLoading(true);
    get(
      `add-dataset${requestHeader({ 'name': inputDatasetName, 'path': inputFile.path, 'return_information': true, 'return_profile': true, 'target_column': inputTargetColumn })}`, // Route
      (response) => handleDialogResponse(response), // Success
      (error) => showAlert('error', error.message) // Error
    );
  };

  // Effects
  useEffect(() => {
    let isMounted = true;
    get(
      `get-datasets-information${requestHeader({ 'return_profile': true })}`, // Route
      (response) => { if (isMounted) { handleDatasetsResponse(response); } }, // Success
      (error) => showAlert('error', error.message) // Error
    );
    return () => { isMounted = false; };
  });

  const tabColors = [
    blue, // a cool, calming color that's easy on the eyes
    red, // a bold, attention-grabbing color that's great for highlighting important data
    green, // a natural, earthy color that's often associated with growth and positivity
    orange, // a warm, energetic color that can add some excitement to your charts
    purple, // a rich, regal color that can add a sense of sophistication and elegance
    teal, // a cool, refreshing color that's often associated with water and nature
    indigo, // a deep, mysterious color that can add some depth and complexity to your charts
    lime, // a bright, cheerful color that's great for highlighting key data points
    deepOrange, // a vibrant, fiery color that can add some intensity and drama to your charts
    lightBlue, // a soft, soothing color that can create a sense of calm and tranquility
    lightGreen, // a fresh, lively color that's often associated with nature and growth
    amber, // a warm, golden color that can add some richness and warmth to your charts
    pink, // a playful, feminine color that can add some personality and charm to your charts
    yellow, // a bright, sunny color that's great for highlighting important data
    cyan, // a cool, refreshing color that's often associated with water and sky
    deepPurple, // a rich, intense color that can add some drama and depth to your charts
    grey // a neutral color that can help balance out brighter colors and create contrast
  ];

  const dataTabs = datasets.map((dataset, index) => {
    return (
      <Tab
        key={ index }
        label={ (
          <Container>
            <Typography variant="h4" sx={ { m: 3 } }>
              {dataset.name}
            </Typography>
            <Typography variant="subtitle3">
              {dataset.description}
            </Typography>
          </Container>
        ) }
        sx={ ({
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark' ? tabColors[index % tabColors.length][800] : tabColors[index % tabColors.length][50],
            color: theme.palette.mode === 'dark' ? tabColors[index % tabColors.length][50] : tabColors[index % tabColors.length][900]
          },
          'backgroundColor': theme.palette.background.card,
          'borderRadius': '10px',
          'color': theme.palette.text.disabled,
          'marginRight': 2
        }) }
        disableRipple
      />
    );
  });


  return (
    <>
      <Helmet>
        <title> Data | NeuroGeMS </title>
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

      <Container maxWidth="xl">

        <Grid container spacing={ 3 }>
          <Grid item style={ { width: '100%' } } lineHeight={ 5 }>

            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={ 5 }>
              <Typography variant="h3" gutterBottom>
                Data
              </Typography>
            </Stack>

            {/* Prompt for new dataset */}
            <Dialog open={ dialogOpen } onClose={ handleDialogClose }>

              <DialogTitle>
                New Dataset
                <IconButton onClick={ handleDialogClose } sx={ { position: 'absolute', right: 8, top: 8, color: theme.palette.grey[500] } }>
                  <Iconify icon="eva:close-fill" />
                </IconButton>
              </DialogTitle>

              <DialogContent>
                <FormControl fullWidth>
                  <TextField required id="dataset-name" label="Name" margin="normal" value={ inputDatasetName } onChange={ (event) => setInputDatasetName(event.target.value) } />
                  <TextField required id="target-column" label="Target Column" margin="normal" value={ inputTargetColumn } onChange={ (event) => setInputTargetColumn(event.target.value) } />
                  <Button component="label" disableRipple sx={ { backgroundColor: theme.palette.background.dropbox, borderStyle: 'dashed', borderColor: theme.palette.grey[400], borderWidth: 0.5, borderRadius: 1, padding: 3, marginTop: 1 } }>
                    <input
                      required
                      type="file"
                      accept=".csv"
                      onChange={ (event) => setInputFile(event.target.files[0]) }
                      hidden
                    />
                    <Iconify icon="eva:cloud-upload-fill" sx={ { size: 66, color: theme.palette.grey[500], marginRight: 1 } } />
                    <Typography variant="subtitle2" sx={ { color: theme.palette.text.disabled } }>
                      Upload File
                    </Typography>
                  </Button>
                  <Typography variant="subtitle3" sx={ { color: theme.palette.text.disabled, marginTop: 1 } }>
                    { (inputFile === undefined || inputFile === null) ? 'CSV file with header' : inputFile.name }
                  </Typography>
                  <LoadingButton variant="contained" sx={ { mt: 3 } } loading={ loading } onClick={ handleNewData }>
                    Submit
                  </LoadingButton>
                </FormControl>
              </DialogContent>

            </Dialog>

            {/* Displaying current datasets */}
            { (datasets.length === 0) ? (
              <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
                { showSkeleton
                  ? <Skeleton variant="rounded" animation="wave" width={ 250 } height={ 128 } sx={ { mb: 3 } } />
                  : (
                    <Stack direction="row" sx={ { mb: 3 } }>
                      <IconButton
                        disableRipple
                        aria-label="add dataset"
                        size="large"
                        onClick={ handleDialogOpen }
                        sx={ {
                          '&:hover': {
                            'backgroundColor': theme.palette.mode === 'dark' ? tabColors[datasets.length % tabColors.length][900] : tabColors[datasets.length % tabColors.length][50],
                            'color': theme.palette.mode === 'dark' ? tabColors[datasets.length % tabColors.length][100] : tabColors[datasets.length % tabColors.length][900]
                          },
                          'backgroundColor': theme.palette.background.card,
                          'borderRadius': '10px',
                          'color': theme.palette.text.disabled,
                          'marginRight': 2
                        } }
                      >
                        <Iconify icon="eva:plus-fill" width={ 45 } sx={ { mx: 6, my: 3 } } />
                      </IconButton>
                    </Stack>
                  )}
              </Grid>
            ) : (
              <Stack direction="row" sx={ { mb: 3 } }>
                <Tabs
                  value={ tab }
                  onChange={ handleTabChange }
                  variant="scrollable"
                  aria-label="Datasets"
                  TabIndicatorProps={ { style: { display: 'none' } } }
                >
                  { dataTabs }
                </Tabs>
                <IconButton
                  disableRipple
                  aria-label="add dataset"
                  size="large"
                  onClick={ handleDialogOpen }
                  sx={ {
                    '&:hover': {
                      'backgroundColor': theme.palette.mode === 'dark' ? tabColors[datasets.length % tabColors.length][800] : tabColors[datasets.length % tabColors.length][50],
                      'color': theme.palette.mode === 'dark' ? tabColors[datasets.length % tabColors.length][100] : tabColors[datasets.length % tabColors.length][900]
                    },
                    'backgroundColor': theme.palette.background.card,
                    'borderRadius': '10px',
                    'color': theme.palette.text.disabled,
                    'marginRight': 2
                  } }
                >
                  <Iconify icon="eva:plus-fill" width={ 45 } sx={ { mx: 6, my: 3 } } />
                </IconButton>
              </Stack>
            ) }

          </Grid>

          {/* Displaying stats for selected dataset */}
          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Card>
              <CardHeader title="Statistics" />
              <CardContent>
                { (datasets.length === 0) ? (
                  showSkeleton ? (
                    <TableContainer>
                      <Table>
                        <TableBody>
                          { DATA_STATS_KEYS.map((key) => (
                            <TableRow key={ `skeleton-stats-${key}` }>
                              <TableCell key={ `skeleton-stats-${key}-label` }>
                                <Skeleton variant="rounded" animation="wave" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                      No data to display
                    </Typography>
                  )
                ) : (
                  <TableContainer>
                    <Table>
                      <TableBody>
                        { DATA_STATS_KEYS.map((key, index) => (
                          <TableRow key={ `data-stats-${key}` }>
                            <TableCell key={ `data-stats-${key}-label` }>
                              <Typography variant="subtitle2" noWrap>
                                { DATA_STATS_LABELS[index] }
                              </Typography>
                            </TableCell>
                            <TableCell key={ `data-stats-${key}-value` }>
                              <Typography variant="body2" noWrap>
                                { datasets[tab].profile.table[key] }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Card>
              <CardHeader title="Variables" />
              <CardContent>
                { (datasets.length === 0) ? (
                  showSkeleton ? (
                    <TableContainer>
                      <Table>
                        <TableBody>
                          { DATA_VARS_KEYS.slice(0, 3).map((key) => (
                            <TableRow key={ `skeleton-vars-${key}` }>
                              <TableCell key={ `skeleton-vars-${key}-label` }>
                                <Skeleton variant="rounded" animation="wave" />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                      No data to display
                    </Typography>
                  )
                ) : (
                  <TableContainer>
                    <Table>
                      <TableBody>
                        { Object.keys(datasets[tab].profile.table.types).map((key) => (
                          <TableRow key={ `data-vars-${key}` }>
                            <TableCell key={ `data-vars-${key}-label` }>
                              <Typography variant="subtitle2" noWrap>
                                { key }
                              </Typography>
                            </TableCell>
                            <TableCell key={ `data-vars-${key}-value` }>
                              <Typography variant="body2" noWrap>
                                { datasets[tab].profile.table.types[key] }
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } md={ 6 } lg={ 4 }>
            {/* TODO: check if target_column is categorical or continuous */}
            { (datasets.length === 0) ? (
              <Card>
                <CardHeader title="Class Labels" />
                <CardContent>
                  { showSkeleton ? (
                    <Skeleton variant="circular" animation="wave" width={ 250 } height={ 250 } sx={ { mx: 'auto', my: 2 } } />
                  ) : (
                    <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                      No data to display
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ) : (
              <ClassLabels
                title="Class Labels"
                chartData={
                  Object.keys(datasets[tab].profile.variables[datasets[tab].target_column].value_counts_index_sorted).map((key) => ({
                    label: key,
                    value: datasets[tab].profile.variables[datasets[tab].target_column].value_counts_index_sorted[key]
                  }))
                }
                chartColors={
                  generateShades(tabColors[tab % tabColors.length], datasets[tab].profile.variables[datasets[tab].target_column].n_distinct)
                }
              />
            )}
          </Grid>

          <Grid item xs={ 12 } md={ 12 } lg={ 12 }>
            <Card>
              <CardHeader title="Feature Visualizer" />
              <CardContent>
                { (datasets.length === 0) ? (
                  <Typography variant="subtitle1" sx={ { my: 2, color: theme.palette.text.disabled } }>
                    No data to display
                  </Typography>
                ) : (
                  <Stack direction={ { xs: 'column', md: 'row' } } spacing={ { xs: 1, sm: 2, md: 4 } } sx={ { p: 1 } }>

                    <Grid item xs={ 12 } md={ 6 } lg={ 4 }>
                      <Autocomplete
                        disableClearable
                        onChange={ handleSelectFeature }
                        id="feature-viz-selection"
                        options={ Object.keys(datasets[tab].profile.variables) }
                        defaultValue={ datasets[tab].target_column }
                        sx={ { px: 1, pb: 3, width: 330 } }
                        renderInput={ (params) => <TextField { ...params } label="Feature" /> }
                      />

                      {(feature === '' ? (setFeature(datasets[tab].target_column)) : null)}

                      {(feature !== ''
                        ? (
                          <TableContainer sx={ { pr: 3 } }>
                            <Table>
                              <TableBody>
                                {(datasets[tab].profile.variables[feature].type === 'Numeric' ? NUMERIC_STATS_KEYS : CATEGORICAL_STATS_KEYS).map((key, index) => (
                                  <TableRow key={ `feature-vars-${key}` }>
                                    <TableCell key={ `feature-vars-${key}-label` }>
                                      <Typography variant="subtitle2" noWrap>
                                        { datasets[tab].profile.variables[feature].type === 'Numeric' ? NUMERIC_STATS_LABELS[index] : CATEGORICAL_STATS_LABELS[index] }
                                      </Typography>
                                    </TableCell>
                                    <TableCell key={ `feature-vars-${key}-value` }>
                                      <Typography variant="body2" noWrap>
                                        {limitDecimalPlaces(datasets[tab].profile.variables[feature][key], 4)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        )
                        : null)}
                    </Grid>

                    {(feature !== ''
                      ? (
                        <Grid item xs={ 12 } md={ 6 } lg={ 8 }>
                          <FeatureVizPlot
                            chartColors={ [
                              tabColors[tab % tabColors.length][700]
                            ] }
                            chartLabels={
                              ((datasets[tab].profile.variables[feature].type === 'Numeric') ? reduceArithmeticProgression(datasets[tab].profile.variables[feature].histogram.bin_edges) : Object.keys(datasets[tab].profile.variables[feature].value_counts_index_sorted))
                            }
                            chartData={ [
                              {
                                name: feature,
                                type: 'column',
                                fill: 'solid',
                                data: ((datasets[tab].profile.variables[feature].type === 'Numeric') ? datasets[tab].profile.variables[feature].histogram.counts : Object.values(datasets[tab].profile.variables[feature].value_counts_index_sorted))
                              }
                            ] }
                          />
                        </Grid>
                      )
                      : null)}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </>
  );
}
