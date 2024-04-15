import { Helmet } from 'react-helmet-async';
import React, { } from 'react';
import { Link } from 'react-router-dom';
// @mui
import {
  Box,
  Card,
  CardHeader,
  Container,
  Grid,
  Stack,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Iconify from 'components/iconify';

// ----------------------------------------------------------------------

export default function HomePage() {
  const theme = useTheme();

  const pandasLogo = theme.palette.mode === 'light' ? '/assets/logos/pandas-logo.png' : '/assets/logos/pandas-logo-dark.svg';
  const sklearnLogo = theme.palette.mode === 'light' ? '/assets/logos/scikit-learn-logo.png' : '/assets/logos/scikit-learn-logo.png';
  const mlflowLogo = theme.palette.mode === 'light' ? '/assets/logos/mlflow-logo.png' : '/assets/logos/mlflow-logo-dark.png';

  return (
    <>
      <Helmet>
        <title> Home | NeuroGeMS </title>
      </Helmet>

      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={ 3 }>
          <Typography variant="h3" gutterBottom>
            Overview
          </Typography>
        </Stack>

        <Grid container spacing={ 3 }>
          <Grid item xs={ 12 } ms={ 12 } lg={ 12 }>
            <Typography variant="body" sx={ { mb: 5 } }>
              NeuroGeMS (Te Ara Poutama ō Tāwhaki) is a tool designed for multimodal machine learning and experiment tracking. It allows you to seamlessly fuse and analyze diverse data sources, create multimodal architectures, and track model performance. NeuroGeMS is designed to be easy to use and easy to extend.
            </Typography>
          </Grid>

          <Grid item xs={ 12 } ms={ 12 } lg={ 12 }>
            <Typography variant="h5" sx={ { mt: 2 } }>
              Quick Start
            </Typography>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Link to="/dashboard/data" style={ { textDecoration: 'none' } }>
              <Card variant="outlined" sx={ { boxShadow: 0 } }>
                <CardHeader
                  title="Load a Dataset"
                  action={ <Iconify icon="eva:arrow-ios-forward-outline" width={ 24 } height={ 24 } sx={ { mt: 1, color: theme.palette.text.primary } } /> }
                  sx={ { mb: 3, color: theme.palette.text.primary } }
                />
              </Card>
            </Link>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Link to="/dashboard/model" style={ { textDecoration: 'none' } }>
              <Card variant="outlined" sx={ { boxShadow: 0 } }>
                <CardHeader
                  title="Create a Model"
                  action={ <Iconify icon="eva:arrow-ios-forward-outline" width={ 24 } height={ 24 } sx={ { mt: 1, color: theme.palette.text.primary } } /> }
                  sx={ { mb: 3, color: theme.palette.text.primary } }
                />
              </Card>
            </Link>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Link to="/dashboard/experiment" style={ { textDecoration: 'none' } }>
              <Card variant="outlined" sx={ { boxShadow: 0 } }>
                <CardHeader
                  title="Run an Experiment"
                  action={ <Iconify icon="eva:arrow-ios-forward-outline" width={ 24 } height={ 24 } sx={ { mt: 1, color: theme.palette.text.primary } } /> }
                  sx={ { mb: 3, color: theme.palette.text.primary } }
                />
              </Card>
            </Link>
          </Grid>

          <Grid item xs={ 12 } ms={ 12 } lg={ 12 }>
            <Typography variant="h5" sx={ { my: 2 } } gutterBottom>
              About
            </Typography>
            <Typography variant="body">
              Developed by the team at KEDRI, Auckland University of Technology. For more information, please visit
              {' '}
              <Typography variant="code">https://kedri.aut.ac.nz/</Typography>
              . This software is currently in
              {' '}
              <span style={ { color: theme.palette.primary.main } }>beta</span>
              .
              {' '}
              Please report any issues on github
              {' '}
              <Typography variant="code">https://github.com/KEDRI-AUT/NeuroGeMS/issues</Typography>
            </Typography>
          </Grid>

          <Grid item xs={ 12 } ms={ 12 } lg={ 12 }>
            <Typography variant="h5" sx={ { mt: 2 } }>
              Frameworks
            </Typography>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Card>
              {/* <CardHeader title="Data Wrangling" /> */}
              <Box sx={ { p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' } }>
                <img
                  src={ pandasLogo }
                  style={ { maxHeight: 66, width: 'auto' } }
                  alt="pandas-logo"
                />
              </Box>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Card>
              {/* <CardHeader title="Model Training" /> */}
              <Box sx={ { p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' } }>
                <img
                  src={ sklearnLogo }
                  style={ { maxHeight: 66, width: 'auto' } }
                  alt="scikit-learn-logo"
                />
              </Box>
            </Card>
          </Grid>

          <Grid item xs={ 12 } ms={ 6 } lg={ 4 }>
            <Card>
              {/* <CardHeader title="Experiment Tracking" /> */}
              <Box sx={ { p: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' } }>
                <img
                  src={ mlflowLogo }
                  style={ { maxHeight: 66, width: 'auto' } }
                  alt="mlflow-logo"
                />
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
