import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
// @mui
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/material';
// components
import { useChart } from 'components/chart';

// ----------------------------------------------------------------------

// Define the prop types for the component
ModelClassificationReport.propTypes = {
  chartColors: PropTypes.arrayOf(PropTypes.string),
  chartData: PropTypes.array,
  chartLabels: PropTypes.arrayOf(PropTypes.string),
  chartMetrics: PropTypes.arrayOf(PropTypes.string),
  average: PropTypes.bool
};

// Define the default props for the component
ModelClassificationReport.defaultProps = {
  chartColors: [],
  chartData: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
  chartLabels: ['Class 1', 'Class 2', 'Class 3'],
  chartMetrics: ['Precision', 'Recall', 'F1 Score'],
  average: false
};

// Define the component function
export default function ModelClassificationReport({ chartColors, chartData, chartLabels, chartMetrics, average, ...props }) {

  // Use theme hook
  const theme = useTheme();

  if (chartColors.length === 0) {
    chartColors = [
      theme.palette.error.dark,
      theme.palette.warning.main,
      theme.palette.primary.main
    ];
  }

  if (average === undefined) {
    average = false;
  }

  const series = (average) ? [{
    data: chartData
  }] : chartData.map((data, index) => ({
    name: chartMetrics[index],
    data
  }));

  // Define the options for the chart using the useChart hook
  const chartOptions = useChart({
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        endingShape: 'rounded',
        distributed: average
      }
    },
    stroke: {
      colors: ['transparent'],
      width: 3
    },
    colors: chartColors,
    xaxis: {
      categories: chartLabels,
      labels: {
        style: {
          colors: theme.palette.text.secondary
        }
      }
    },
    yaxis: {
    //   min: 0,
    //   max: 1,
      labels: {
        style: {
          colors: theme.palette.text.secondary
        },
        formatter: (value) => `${(value * 100).toFixed(0)}%`
      }
    },
    grid: {
      borderColor: theme.palette.divider
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => `${(val * 100).toFixed(2)}%`
      }
    }
  });



  return (
    <Box sx={ { px: 3, py: 2 } } dir="ltr">
      <ReactApexChart
        type="bar"
        series={ series }
        options={ chartOptions }
        height={ 364 }
        { ...props }
      />
    </Box>
  );
}