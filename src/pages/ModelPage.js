import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { sentenceCase } from 'change-case';
import { faker } from '@faker-js/faker';
import React, { useEffect, useState } from 'react';
// @mui
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Snackbar,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
// react-flow
import ReactFlow, { Background, Controls } from 'react-flow-renderer';
// components
import Label from 'components/label';
import Iconify from 'components/iconify';
import Scrollbar from 'components/scrollbar';
// sections
import { TableListHead } from 'sections/@dashboard/table';
import { ModelListToolbar, EarlyFusionInput, LateFusionInput, UnimodalInput } from 'sections/@dashboard/model';
// utils
// import { usePersistentState } from 'utils/hooks';
import { get, requestHeader } from 'utils/requests';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Model Name', alignRight: false },
  { id: 'strategy', label: 'Strategy', alignRight: false },
  { id: 'version', label: 'Version', alignRight: false },
  { id: '' }
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

// ----------------------------------------------------------------------

export default function ModelPage() {
  const theme = useTheme();

  // State variables
  const [open, setOpen] = useState(null);

  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('asc');

  const [selected, setSelected] = useState([]);

  const [orderBy, setOrderBy] = useState('name');

  const [filterName, setFilterName] = useState('');

  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [alert, setAlert] = useState({ open: false, message: '', variant: 'info' });

  const [activeStep, setActiveStep] = useState(0);

  const [strategyName, setStrategyName] = useState('');

  const [selectedStrategy, setSelectedStrategy] = useState('');

  const [supportedStrategies, setSupportedStrategies] = useState([]);

  const [savedStrategies, setSavedStrategies] = useState([]);

  const [popoverStrategy, setPopoverStrategy] = useState('');

  const [nodes, setNodes] = useState([]);

  const [edges, setEdges] = useState([]);

  useEffect(() => {
    let mounted = true;
    setTimeout(() => get(
      'get-supported-strategies', // Route
      (response) => {
        if (mounted) {
          setSupportedStrategies(response);
        }
      }, // Success callback
      (error) => console.error(error) // Error callback
    ), 1000);
    return () => { mounted = false; };
  });

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
  }, [nodes, edges, popoverStrategy]);

  // Handlers
  const showAlert = (variant, message) => { setAlert({ open: true, message, variant }); };
  const handleAlertClose = () => { setAlert({ ...alert, open: false }); };

  const renderStrategyInput = () => {
    switch (selectedStrategy) {
      case 'unimodal':
        return (
          <UnimodalInput
            strategyName={ strategyName }
            setNodes={ setNodes }
            setEdges={ setEdges }
            showAlert={ showAlert }
          />
        );
      case 'early_fusion':
        return (
          <EarlyFusionInput
            strategyName={ strategyName }
            setNodes={ setNodes }
            setEdges={ setEdges }
            showAlert={ showAlert }
          />
        );
      case 'late_fusion':
        return (
          <LateFusionInput
            strategyName={ strategyName }
            setNodes={ setNodes }
            setEdges={ setEdges }
            showAlert={ showAlert }
          />
        );
      default:
        return <></>;
    }
  };

  const handleAutoStrategyName = () => {
    setStrategyName(`${faker.hacker.adjective()}-${faker.color.human()}`);
  };

  const handleCreateStrategy = () => {
    setTimeout(() => get(
      `create-strategy${requestHeader({ strategy_name: strategyName, strategy_type: selectedStrategy })}`, // Route
      (response) => console.log(response), // Response callback
      (error) => console.error(error) // Error callback
    ), 1000);
    setActiveStep(activeStep + 1);
  };

  const handleStepBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSelectStrategy = (event, newStrategy) => {
    if (newStrategy !== null) {
      setSelectedStrategy(newStrategy.name);
    }
  };

  const handleOpenMenu = (event, name) => {
    setOpen(event.currentTarget);
    setPopoverStrategy(name);
  };

  const handleCloseMenu = () => {
    setOpen(null);
    setPopoverStrategy('');
  };

  const handleEditStrategy = () => {
    setStrategyName(popoverStrategy);
    setSelectedStrategy(savedStrategies.find((strategy) => strategy.name === popoverStrategy).type);
    handleCloseMenu();
  };

  const handleDeleteStrategy = () => {
    setTimeout(() => get(
      `rm-strategy${requestHeader({ strategy_name: popoverStrategy })}`, // Route
      (response) => showAlert('success', response), // Response callback
      (error) => console.error(error) // Error callback
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
      const newSelecteds = savedStrategies.map((n) => n.name);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, name) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - savedStrategies.length) : 0;

  const filteredModels = applySortFilter(savedStrategies, getComparator(order, orderBy), filterName);

  const isNotFound = !filteredModels.length && !!filterName;

  const noRows = savedStrategies.length === 0 && !filterName;

  // Render
  return (
    <>
      <Helmet>
        <title> Model | NeuroGeMS </title>
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={ 5 }>
          <Typography variant="h3" gutterBottom>
            Model
          </Typography>
        </Stack>

        <Grid container spacing={ 3 }>
          <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <Card>
              <CardHeader title="Models" />
              <ModelListToolbar numSelected={ selected.length } filterName={ filterName } onFilterName={ handleFilterByName } />

              <Scrollbar>
                <TableContainer sx={ { minWidth: 400 } }>
                  <Table>
                    <TableListHead
                      order={ order }
                      orderBy={ orderBy }
                      headLabel={ TABLE_HEAD }
                      rowCount={ savedStrategies.length }
                      numSelected={ selected.length }
                      onRequestSort={ handleRequestSort }
                      onSelectAllClick={ handleSelectAllClick }
                    />
                    <TableBody>
                      {filteredModels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                        const { id, name, type, version } = row;
                        const selectedUser = selected.indexOf(name) !== -1;

                        return (
                          <TableRow hover key={ `${id}-${name}` } tabIndex={ -1 } role="checkbox" selected={ selectedUser }>
                            <TableCell padding="checkbox">
                              <Checkbox checked={ selectedUser } onChange={ (event) => handleClick(event, name) } />
                            </TableCell>

                            <TableCell component="th" scope="row">
                              <Stack direction="row" alignItems="center" spacing={ 2 }>
                                <Typography variant="subtitle2" noWrap>
                                  {name}
                                </Typography>
                              </Stack>
                            </TableCell>

                            <TableCell align="left">{ sentenceCase(type) }</TableCell>

                            <TableCell align="left">
                              <Label color="success">{ `Version ${version}` }</Label>
                            </TableCell>

                            <TableCell align="right">
                              <IconButton size="large" color="inherit" onClick={ (event) => handleOpenMenu(event, name) }>
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

                    {noRows && (
                      <TableBody>
                        <TableRow>
                          <TableCell align="center" colSpan={ 6 } sx={ { py: 3 } }>
                            <Typography variant="h6" paragraph>
                              No models
                            </Typography>

                            <Typography variant="body2">
                              Create a new model by clicking the &quot;+&quot; button above.
                            </Typography>
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
                count={ savedStrategies.length }
                rowsPerPage={ rowsPerPage }
                page={ page }
                onPageChange={ handleChangePage }
                onRowsPerPageChange={ handleChangeRowsPerPage }
                sx={ { mx: 2, my: 1 } }
              />
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 6 }>
            <Card>
              <CardHeader title="Configure Model" />
              <CardContent>
                <Stepper activeStep={ activeStep } orientation="vertical">
                  <Step key="0">
                    { activeStep === 0 ? (
                      <StepLabel>Choose Strategy</StepLabel>
                    ) : (
                      <StepLabel>
                        Choose Strategy
                        <Chip label={ `Name: ${strategyName}` } sx={ { bgcolor: theme.palette.mode === 'dark' ? 'warning.dark' : 'warning.lighter', ml: 1 } } />
                        <Chip label={ `Strategy: ${selectedStrategy}` } sx={ { bgcolor: theme.palette.mode === 'dark' ? 'error.dark' : 'error.lighter', ml: 1 } } />
                      </StepLabel>
                    ) }
                    <StepContent>
                      <FormControl fullWidth sx={ { py: 2 } }>
                        <TextField
                          required
                          id="outlined-required"
                          label="Model Name"
                          onChange={ (e) => setStrategyName(e.target.value) }
                          value={ strategyName }
                          InputProps={ { endAdornment: <Button size="small" onClick={ handleAutoStrategyName }>AUTO</Button> } }
                        />
                        <Autocomplete
                          disableClearable
                          required
                          id="strategy-selection"
                          // value={ selectedStrategy }
                          options={ supportedStrategies }
                          groupBy={ (option) => option.group }
                          getOptionLabel={ (option) => (option ? option.description : '') } // ((option && option.description) ? option.description : (option ? supportedStrategies[option].description : '')) }
                          isOptionEqualToValue={ (option, value) => option.name === value }
                          onChange={ handleSelectStrategy }
                          sx={ { mb: 1 } }
                          renderInput={ (params) => <TextField { ...params } label="Strategy" margin="normal" /> }
                        />
                      </FormControl>
                      <Box sx={ { display: 'flex', justifyContent: 'flex-end' } }>
                        <Button variant="contained" color="primary" onClick={ handleCreateStrategy } endIcon={ <Iconify icon="eva:arrow-ios-forward-outline" /> }>
                          Next
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                  <Step key="1">
                    <StepLabel>Define Pipeline</StepLabel>
                    <StepContent>
                      { renderStrategyInput() }
                      <Box sx={ { display: 'flex', justifyContent: 'flex-start', mt: 1 } }>
                        <Button onClick={ handleStepBack } startIcon={ <Iconify icon="eva:arrow-ios-back-outline" /> }>
                          Back
                        </Button>
                      </Box>
                    </StepContent>
                  </Step>
                </Stepper>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 12 } lg={ 12 }>
            <Card>
              <CardHeader title="Model Visualizer" />
              <CardContent>
                <Box sx={ { height: 500, position: 'relative' } }>
                  <ReactFlow
                    nodes={ nodes }
                    edges={ edges }
                  >
                    <Background />
                    <Controls />
                  </ReactFlow>
                </Box>
              </CardContent>
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
        <MenuItem onClick={ handleEditStrategy }>
          <Iconify icon="eva:edit-fill" sx={ { mr: 2 } } />
          Edit
        </MenuItem>

        <MenuItem onClick={ handleDeleteStrategy } sx={ { color: 'error.main' } }>
          <Iconify icon="eva:trash-2-outline" sx={ { mr: 2 } } />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}
