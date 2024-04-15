// component
import React from 'react';
import Iconify from 'components/iconify';
// import { Chip } from '@mui/material';

// ----------------------------------------------------------------------

const navConfig = [
  {
    title: 'home',
    path: '/dashboard/home',
    icon: <Iconify icon="eva:home-outline" />,
  },
  {
    title: 'data',
    path: '/dashboard/data',
    icon: <Iconify icon="eva:folder-outline" />
  },
  {
    title: 'model',
    path: '/dashboard/model',
    icon: <Iconify icon="eva:layers-outline" />
  },
  {
    title: 'experiment',
    path: '/dashboard/experiment',
    icon: <Iconify icon="eva:options-outline" />
  },
  // {
  //   title: 'predict',
  //   path: '/dashboard/predict',
  //   icon: <Iconify icon="eva:compass-outline" />,
  //   info: <Chip label="Coming soon" />,
  //   disabled: true
  // },
  {
    title: 'settings',
    path: '/dashboard/settings',
    icon: <Iconify icon="eva:settings-2-outline" />
  }
];

export default navConfig;
