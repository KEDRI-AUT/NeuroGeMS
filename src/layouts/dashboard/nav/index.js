import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// @mui
// import { styled, alpha } from '@mui/material/styles';
import {
  // Avatar,
  // Button,
  Box,
  Drawer,
  IconButton,
  // Link,
  // Stack,
  Typography
} from '@mui/material';
// mock
// import account from '_mock/account';
// hooks
import useResponsive from 'hooks/useResponsive';
// components
import Logo from 'components/logo';
import Scrollbar from 'components/scrollbar';
import NavSection from 'components/nav-section';
import Iconify from 'components/iconify';
//
import navConfig from './config';

// ----------------------------------------------------------------------

const NAV_WIDTH = 280;
const MINI_NAV_WIDTH = 75;

// const StyledAccount = styled('div')(({ theme }) => ({
//   display: 'flex',
//   alignItems: 'center',
//   padding: theme.spacing(2, 2.5),
//   borderRadius: Number(theme.shape.borderRadius) * 1.5,
//   backgroundColor: alpha(theme.palette.grey[500], 0.12),
// }));

// ----------------------------------------------------------------------

Nav.propTypes = {
  open: PropTypes.bool,
  handleNavClose: PropTypes.func,
  handleNavOpen: PropTypes.func
};

export default function Nav({ open, handleNavClose, handleNavOpen }) {
  const { pathname } = useLocation();

  const isDesktop = useResponsive('up', 'lg');

  useEffect(() => {
    if (!isDesktop && open) {
      handleNavClose();
    }
  }, [pathname]);

  const handleNavToggle = () => {
    if (open) {
      handleNavClose();
    } else {
      handleNavOpen();
    }
  };

  const renderContent = (
    <Scrollbar
      sx={ {
        'height': 1,
        '& .simplebar-content': { height: 1, display: 'flex', flexDirection: 'column' }
      } }
    >

      <Box sx={ { display: 'inline-flex', px: open ? 2.5 : 1.5, py: 3, mb: 2 } }>
        <Logo />
        <Typography variant="h5" sx={ { px: open ? 1 : 0, py: 0.5 } }>
          { open ? (
            'NeuroGeMS'
          ) : null }
        </Typography>
      </Box>

      <NavSection data={ navConfig } open={ open } />

    </Scrollbar>
  );

  return (
    <Box
      component="nav"
      sx={ {
        flexShrink: { lg: 0 },
        width: { lg: (isDesktop && !open) ? MINI_NAV_WIDTH : NAV_WIDTH },
        overflow: 'visible'
      } }
    >
      {isDesktop ? (
        <Box position="relative">
          <IconButton
            onClick={ handleNavToggle }
            size="small"
            sx={ {
              border: '1px',
              borderStyle: 'dashed',
              borderColor: 'divider',
              position: 'fixed',
              top: '32px',
              left: open ? NAV_WIDTH - 14 : MINI_NAV_WIDTH - 14,
              zIndex: 9999,
              padding: '2px',
              backdropFilter: 'blur(6px)'
            } }
          >
            {open ? <Iconify icon="eva:arrow-ios-back-fill" /> : <Iconify icon="eva:arrow-ios-forward-fill" />}
          </IconButton>
          <Drawer
            open
            variant="permanent"
            PaperProps={ {
              sx: {
                // width: open ? NAV_WIDTH : MINI_NAV_WIDTH,
                bgcolor: 'background.default',
                borderRightStyle: 'dashed',
                overflow: 'visible'
              }
            } }
            sx={ {
              'width': NAV_WIDTH,
              'flexShrink': 0,
              'whiteSpace': 'nowrap',
              '& .MuiDrawer-paper': {
                width: NAV_WIDTH,
                transition: (theme) => theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen
                }),
                boxSizing: 'border-box',
                ...(open && { overflowX: 'hidden' }),
                ...(!open && {
                  transition: (theme) => theme.transitions.create('width', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.leavingScreen
                  }),
                  width: `${MINI_NAV_WIDTH}px`
                })
              }
            } }
          >
            {renderContent}
          </Drawer>
        </Box>
      ) : (
        <Drawer
          open={ open }
          onClose={ handleNavClose }
          ModalProps={ {
            keepMounted: true
          } }
          PaperProps={ {
            sx: { width: NAV_WIDTH }
          } }
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
