import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
// @mui
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
// components
import { useChart } from 'components/chart';

// ----------------------------------------------------------------------

DecisionBoundaryPlot.propTypes = {
  chartColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  chartData: PropTypes.array.isRequired,
  chartLabels: PropTypes.arrayOf(PropTypes.string).isRequired
};

export default function DecisionBoundaryPlot({ chartColors, chartLabels, chartData, ...other }) {
  const theme = useTheme();
  const chartOptions = useChart({
    plotOptions: {
      scatter: {
        fillOpacity: 0.5
      }
    },
    colors: [theme.palette.background.neutral],
    labels: chartLabels,
    legend: {
      show: false
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => `${val}%`
      }
    }
  });

  return (
    <Box sx={ { px: 3, pb: 1 } } dir="ltr">
      <ReactApexChart type="area" series={ chartData } options={ chartOptions } height={ 364 } />
    </Box>
  );
}
