import { Helmet } from 'react-helmet-async';
import React, { useContext } from 'react';
import ThemeContext from 'theme/themeContext';
// @mui
import { Container, FormControlLabel, Switch, Typography } from '@mui/material';

// ----------------------------------------------------------------------

export default function SettingsPage() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  return (
    <>
      <Helmet>
        <title> Settings | NeuroGeMS </title>
      </Helmet>

      <Container>
        <Typography variant="h3" sx={ { mb: 5 } }>
          Settings
        </Typography>

        <FormControlLabel
          control={ (
            <Switch
              checked={ isDarkMode }
              onChange={ toggleTheme }
              name="darkModeSwitch"
              color="primary"
            />
          ) }
          label="Dark Mode"
        />

      </Container>
    </>
  );
}
