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
ModelConfusionMatrix.propTypes = {
  chartColors: PropTypes.arrayOf(PropTypes.string),
  chartData: PropTypes.array,
  chartLabels: PropTypes.arrayOf(PropTypes.string)
};

// Define the default props for the component
ModelConfusionMatrix.defaultProps = {
  chartColors: [],
  chartData: [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ],
  chartLabels: ['Class 1', 'Class 2', 'Class 3']
};

// Define the component function
export default function ModelConfusionMatrix({ chartColors, chartData, chartLabels, ...props }) {

  // Use theme hook
  const theme = useTheme();

  if (chartColors.length === 0) {
    chartColors = [
      theme.palette.warning.light,
      theme.palette.warning.main,
      theme.palette.error.dark,
      theme.palette.error.darker
    ];
  }

  // Get the maximum value of the chart data
  const maxValue = Math.max(...chartData.flat());

  // Define the chart options using the useChart hook
  const chartOptions = useChart({
    chart: {
      type: 'heatmap'
    },
    plotOptions: {
      heatmap: {
        radius: 0,
        enableShades: false,
        colorScale: {
          ranges: chartColors.map((_, index) => ({
            from: (index * maxValue) / chartColors.length,
            to: ((index + 1) * maxValue) / chartColors.length,
            color: chartColors[index]
          }))
        }
      }
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '20px',
        fontWeight: 400,
        fontFamily: theme.typography.fontFamily
      }
    },
    xaxis: {
      categories: chartLabels,
      labels: {
        show: true,
        hideOverlappingLabels: true,
        showDuplicates: false,
        style: {
          fontSize: '12px'
        }
      },
      position: 'bottom',
      title: {
        text: 'Predicted Class',
        style: {
          fontSize: '14px'
        },
        offsetX: 0,
        offsetY: 87
      }
    },
    yaxis: {
      categories: chartLabels,
      labels: {
        show: true,
        hideOverlappingLabels: true,
        showDuplicates: false,
        style: {
          fontSize: '12px'
        }
      },
      reversed: true,
      title: {
        text: 'True Class',
        style: {
          fontSize: '13.5px'
        }
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      enabled: true
    }
  });

  // Prepare data for the chart
  const series = chartData.map((row, index) => ({
    name: chartLabels[index],
    data: row.map((value, idx) => ({
      x: chartLabels[idx],
      y: value
    }))
  }));

  // Render the chart using ReactApexChart
  return (
    <Box sx={ { px: 3, pb: 2 } } dir="ltr">
      <ReactApexChart
        type="heatmap"
        series={ series }
        options={ chartOptions }
        height={ 364 }
        { ...props }
      />
    </Box>
  );
}
