import { alpha } from '@mui/material/styles';

// ----------------------------------------------------------------------

// SETUP COLORS
const GREY = {
  0: '#FFFFFF',
  50: '#FBFCFC',
  100: '#F9FAFB',
  200: '#F4F6F8',
  300: '#DFE3E8',
  400: '#C4CDD5',
  500: '#919EAB',
  600: '#637381',
  700: '#454F5B',
  800: '#212B36',
  900: '#161C24'
};

const PRIMARY = {
  lighter: '#C8FACD',
  light: '#5BE584',
  main: '#00AB55',
  dark: '#007B55',
  darker: '#005249',
  contrastText: '#fff',
};

const SECONDARY = {
  lighter: '#D6E4FF',
  light: '#84A9FF',
  main: '#3366FF',
  dark: '#1939B7',
  darker: '#091A7A',
  contrastText: '#fff',
};

const INFO = {
  lighter: '#CAFDF5',
  light: '#61F3F3',
  main: '#00B8D9',
  dark: '#006C9C',
  darker: '#003768',
  contrastText: '#fff',
};

const SUCCESS = {
  lighter: '#D8FBDE',
  light: '#86E8AB',
  main: '#36B37E',
  dark: '#1B806A',
  darker: '#0A5554',
  contrastText: GREY[800],
};

const WARNING = {
  lighter: '#FFF5CC',
  light: '#FFD666',
  main: '#FFAB00',
  dark: '#B76E00',
  darker: '#7A4100',
  contrastText: GREY[800],
};

const ERROR = {
  lighter: '#FFE9D5',
  light: '#FFAC82',
  main: '#FF5630',
  dark: '#B71D18',
  darker: '#7A0916',
  contrastText: '#fff',
};

const palette = (isDarkMode) => ({
  mode: isDarkMode ? 'dark' : 'light',
  common: { black: '#000', white: '#fff' },
  primary: PRIMARY,
  secondary: SECONDARY,
  info: INFO,
  success: SUCCESS,
  warning: WARNING,
  error: ERROR,
  grey: GREY,
  divider: alpha(GREY[500], 0.24),
  text: {
    primary: isDarkMode ? GREY[50] : GREY[800],
    secondary: isDarkMode ? GREY[100] : GREY[600],
    disabled: isDarkMode ? GREY[200] : GREY[500]
  },
  background: {
    paper: isDarkMode ? GREY[800] : '#fff',
    default: isDarkMode ? GREY[900] : GREY[50],
    neutral: isDarkMode ? GREY[700] : GREY[100],
    natural: isDarkMode ? GREY[700] : GREY[200],
    dropbox: isDarkMode ? GREY[800] : GREY[50],
    card: isDarkMode ? GREY[800] : GREY[200]
  },
  action: {
    active: isDarkMode ? GREY[100] : GREY[600],
    hover: alpha(isDarkMode ? GREY[100] : GREY[500], 0.08),
    selected: alpha(isDarkMode ? GREY[100] : GREY[500], 0.16),
    disabled: alpha(isDarkMode ? GREY[100] : GREY[500], 0.8),
    disabledBackground: alpha(isDarkMode ? GREY[100] : GREY[500], 0.24),
    focus: alpha(isDarkMode ? GREY[100] : GREY[500], 0.24),
    hoverOpacity: 0.08,
    disabledOpacity: 0.48,
  },
});


export default palette;
