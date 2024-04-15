import React, { useContext } from 'react';
import ThemeContext from 'theme/themeContext';
// @mui
import { IconButton } from '@mui/material';
// components
import Iconify from 'components/iconify';

// ----------------------------------------------------------------------

export default function DarkMode() {
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);


  return (
    <>
      <IconButton
        onClick={ toggleTheme }
      >
        {isDarkMode ? (
          <Iconify icon="eva:sun-fill" width={ 20 } height={ 20 } />
        ) : (
          <Iconify icon="eva:moon-fill" width={ 20 } height={ 20 } />
        )}
      </IconButton>
    </>
  );
}
