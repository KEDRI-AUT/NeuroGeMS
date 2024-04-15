import React from 'react';
import PropTypes from 'prop-types';
import { NavLink as RouterLink } from 'react-router-dom';
// @mui
import { Box, List, ListItemText } from '@mui/material';
//
import { StyledNavItem, StyledNavItemIcon } from './styles';

// ----------------------------------------------------------------------

NavSection.propTypes = {
  data: PropTypes.array,
  open: PropTypes.bool
};

export default function NavSection({ data = [], open = true, ...other }) {
  return (
    <Box { ...other }>
      <List disablePadding sx={ { p: 1 } }>
        {data.map((item) => (
          <NavItem key={ item.title } item={ item } open={ open } />
        ))}
      </List>
    </Box>
  );
}

// ----------------------------------------------------------------------

NavItem.propTypes = {
  item: PropTypes.object,
  open: PropTypes.bool
};

function NavItem({ item, open }) {
  const { title, path, icon, info, disabled } = item;

  return (
    <StyledNavItem
      component={ RouterLink }
      to={ path }
      disabled={ disabled }
      sx={ {
        '&.active': {
          color: 'text.primary',
          bgcolor: 'action.selected',
          fontWeight: 'fontWeightBold'
        }
      } }
    >
      <StyledNavItemIcon>{icon && icon}</StyledNavItemIcon>

      { open && <ListItemText disableTypography primary={ title } /> }

      { open && info && info }
    </StyledNavItem>
  );
}
