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
ModelAccuracy.propTypes = {
  chartColors: PropTypes.arrayOf(PropTypes.string),
  chartData: PropTypes.array,
  chartLabels: PropTypes.arrayOf(PropTypes.string)
};

// Define the default props for the component
ModelAccuracy.defaultProps = {
  chartColors: [],
  chartData: [0],
  chartLabels: ['']
};

// Define the component function
export default function ModelAccuracy({ chartColors, chartLabels, chartData, ...props }) {

  // Use theme hook
  const theme = useTheme();

  if (chartColors.length === 0) {
    chartColors = [
      theme.palette.success.darker,
      theme.palette.primary.dark,
      theme.palette.primary.main,
      theme.palette.success.light
    ];
  }

  // Define the options for the chart using the useChart hook
  const chartOptions = useChart({
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          margin: 0,
          size: '60%'
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '18px',
            offsetY: 8
          },
          value: {
            offsetY: -40,
            fontSize: '24px'
          },
          total: {
            show: true,
            label: 'Validation Accuracy',
            color: theme.palette.text.disabled,
            fontWeight: 'normal',
            formatter: (w) => {
              return `${chartData.reduce((acc, val) => acc + Math.round(val * 10) / 10, 0)}%`;
            }
          }
        }
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        colorStops: chartColors.map((_, index) => ({
          offset: (index * 100) / (chartColors.length - 1),
          color: chartColors[index],
          opacity: 1
        }))
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

  // Render the chart using ReactApexChart
  return (
    <Box sx={ { px: 3, pb: 1 } } dir="ltr">
      <ReactApexChart
        type="radialBar"
        series={ chartData }
        options={ chartOptions }
        height={ 364 }
        { ...props }
      />
    </Box>
  );
}
