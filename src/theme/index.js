import PropTypes from 'prop-types';
import React, { useMemo, useState } from 'react';
// @mui
import { CssBaseline } from '@mui/material';
import { ThemeProvider as MUIThemeProvider, createTheme, StyledEngineProvider } from '@mui/material/styles';
//
import palette from './palette';
import shadows from './shadows';
import typography from './typography';
import GlobalStyles from './globalStyles';
import customShadows from './customShadows';
import componentsOverride from './overrides';
import ThemeContext from './themeContext';

// ----------------------------------------------------------------------

ThemeProvider.propTypes = {
  children: PropTypes.node
};

export default function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeOptions = useMemo(
    () => ({
      customShadows: customShadows(isDarkMode),
      palette: palette(isDarkMode),
      shadows: shadows(isDarkMode),
      shape: { borderRadius: 6 },
      typography
    }),
    [isDarkMode]
  );

  const theme = createTheme(themeOptions);
  theme.components = componentsOverride(theme);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeContext.Provider value={ { isDarkMode, toggleTheme } }>
        <MUIThemeProvider theme={ theme }>
          <CssBaseline />
          <GlobalStyles />
          {children}
        </MUIThemeProvider>
      </ThemeContext.Provider>
    </StyledEngineProvider>
  );
}
