import React from 'react';
import PropTypes from 'prop-types';
// @mui
import { styled } from '@mui/material/styles';
import {
  AppBar,
  Box,
  IconButton,
  Stack,
  Toolbar
} from '@mui/material';
// utils
import { bgBlur } from 'utils/cssStyles';
// components
import Iconify from 'components/iconify';
import DarkMode from './DarkMode';
// import Searchbar from './Searchbar';
// import AccountPopover from './AccountPopover';
// import LanguagePopover from './LanguagePopover';
// import NotificationsPopover from './NotificationsPopover';

// ----------------------------------------------------------------------

const NAV_WIDTH = 280;
const MINI_NAV_WIDTH = 75;

const HEADER_MOBILE = 64;

const HEADER_DESKTOP = 92;

const StyledRoot = styled(AppBar)(({ theme }) => ({
  ...bgBlur({ color: theme.palette.background.default }),
  boxShadow: 'none'
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: HEADER_MOBILE,
  [theme.breakpoints.up('lg')]: {
    minHeight: HEADER_DESKTOP,
    padding: theme.spacing(0, 5)
  }
}));

// ----------------------------------------------------------------------

Header.propTypes = {
  open: PropTypes.bool,
  handleNavOpen: PropTypes.func
};

export default function Header({ open, handleNavOpen }) {
  return (
    <StyledRoot sx={ { width: { lg: open ? `calc(100% - ${NAV_WIDTH + 1}px)` : `calc(100% - ${MINI_NAV_WIDTH + 1}px)` } } }>
      <StyledToolbar>
        <IconButton
          onClick={ handleNavOpen }
          sx={ {
            mr: 1,
            color: 'text.primary',
            display: { lg: 'none' }
          } }
        >
          <Iconify icon="eva:menu-2-fill" />
        </IconButton>

        {/* <Searchbar /> */}
        <Box sx={ { flexGrow: 1 } } />

        <Stack
          direction="row"
          alignItems="center"
          spacing={ {
            xs: 0.5,
            sm: 1
          } }
        >
          <DarkMode />
          {/* <LanguagePopover />
          <NotificationsPopover />
          <AccountPopover /> */}
        </Stack>
      </StyledToolbar>
    </StyledRoot>
  );
}
