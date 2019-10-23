import 'typeface-roboto';
import 'material-design-icons-iconfont/dist/material-design-icons.css';
import './styles.css';

export { ReactView } from './ReactView';
export { HtmlModel } from './Html';
export { default as React } from 'react';
export { default as ReactDOM } from 'react-dom';
export * from '@material-ui/core';
export * from '@material-ui/lab';
export * from './generated';
export * from './generated_lab';

export const { version } = require('../package.json'); // eslint-disable-line global-require
