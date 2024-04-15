import React from 'react';
import PropTypes from 'prop-types';
import ReactApexChart from 'react-apexcharts';
// @mui
import { Box } from '@mui/material';
// components
import { useChart } from 'components/chart';

// ----------------------------------------------------------------------

FeatureVizPlot.propTypes = {
  chartColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  chartData: PropTypes.array.isRequired,
  chartLabels: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])).isRequired
};

export default function FeatureVizPlot({ chartColors, chartLabels, chartData, ...other }) {
  const chartOptions = useChart({
    ...other,
    plotOptions: {
      bar: {
        columnWidth: '60%'
      }
    },
    colors: chartColors,
    fill: { type: chartData.map((i) => i.fill) },
    labels: chartLabels,
    xaxis: {
      labels: {
        formatter(value) {
          if (typeof value === 'number') {
            return Math.round(value * 10) / 10;
          }
          return value;
        }
      }
    },
    tooltip: {
      intersect: false,
      shared: true,
      x: {
        formatter: (x) => (typeof chartLabels[x - 1] === 'number'
          ? chartLabels[x - 1].toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
          : chartLabels[x - 1] || '')
      }
    }
  });

  return (
    <Box dir="ltr">
      <ReactApexChart type="line" series={ chartData } options={ chartOptions } height={ 464 } />
    </Box>
  );
}
