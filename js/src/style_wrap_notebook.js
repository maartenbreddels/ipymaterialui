// This is a specific 'fix' for the notebook only, since its fontsize is non-16
import * as React from 'react';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const theme = createMuiTheme({
    typography: {
        // Tell Material-UI what the font-size on the html element is.
        htmlFontSize: 10,
        useNextVariants: true,
    },
});

function FontSizeTheme(props) {
    return (
        <MuiThemeProvider theme={theme}>
            <Typography component="span">{props.children}</Typography>
        </MuiThemeProvider>
    );
}

export 
function styleWrapper(element) {
    return <FontSizeTheme>{element}</FontSizeTheme>
}