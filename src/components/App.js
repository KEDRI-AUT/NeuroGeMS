import React, { Fragment } from 'react';

import ThemeProvider from 'theme';
import ScrollToTop from 'components/scroll-to-top';
import Router from 'components/routes';

function App() {

  return (
    <ThemeProvider>
      <Fragment>
        <ScrollToTop />
        <Router />
      </Fragment>
    </ThemeProvider>
  );
}

export default App;
