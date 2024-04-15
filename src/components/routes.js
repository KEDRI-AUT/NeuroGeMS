import React from 'react';
import { Navigate, useRoutes } from 'react-router-dom';
// layouts
import DashboardLayout from 'layouts/dashboard';
import SimpleLayout from 'layouts/simple';
// pages
import HomePage from 'pages/HomePage';
import DataPage from 'pages/DataPage';
import ModelPage from 'pages/ModelPage';
import ExperimentPage from 'pages/ExperimentPage';
import SettingsPage from 'pages/SettingsPage';
import Page404 from 'pages/Page404';

// ----------------------------------------------------------------------

export default function Router() {
  const routes = useRoutes([
    {
      path: '/dashboard',
      element: <DashboardLayout />,
      children: [
        { element: <Navigate to="/dashboard/home" />, index: true },
        { path: 'home', element: <HomePage /> },
        { path: 'data', element: <DataPage /> },
        { path: 'model', element: <ModelPage /> },
        { path: 'experiment', element: <ExperimentPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: '404', element: <Page404 /> }
      ]
    },
    {
      element: <SimpleLayout />,
      children: [
        { element: <Navigate to="/dashboard/home" />, index: true },
        { path: '*', element: <Navigate to="/dashboard/404" /> }
      ]
    },
    {
      path: '*',
      element: <Navigate to="/dashboard/404" replace />
    }
  ]);

  return routes;
}
