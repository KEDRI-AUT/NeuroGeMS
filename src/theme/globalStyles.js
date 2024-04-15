// @mui
import React from 'react';
import { GlobalStyles as MUIGlobalStyles } from '@mui/material';

// ----------------------------------------------------------------------

export default function GlobalStyles() {
  const inputGlobalStyles = (
    <MUIGlobalStyles
      styles={ {
        '#root': {
          height: '100%',
          width: '100%'
        },
        '*': {
          boxSizing: 'border-box'
        },
        'body': {
          height: '100%',
          margin: 0,
          padding: 0,
          width: '100%'
        },
        'html': {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch'
        },
        'img': {
          display: 'block',
          maxWidth: '100%'
        },
        'input': {
          '&[type=number]': {
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none'
            },
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none'
            },
            'MozAppearance': 'textfield'
          }
        },
        'ul': {
          margin: 0,
          padding: 0
        }
      } }
    />
  );

  return inputGlobalStyles;
}
