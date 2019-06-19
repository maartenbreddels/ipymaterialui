/* eslint-disable no-console */

import { mkdir, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import kebabCase from 'lodash/kebabCase';
import { defaultHandlers, parse as docgenParse } from 'react-docgen';
import muiDefaultPropsHandler from '../src/modules/utils/defaultPropsHandler';
import { findPagesMarkdown, findComponents } from '../src/modules/utils/find';
import parseTest from '../src/modules/utils/parseTest';
import createMuiTheme from '../../packages/material-ui/src/styles/createMuiTheme';
import getStylesCreator from '../../packages/material-ui-styles/src/getStylesCreator';

// Read the command-line args
const args = process.argv;

// Exit with a message
function exit(error) {
  console.log(error, '\n');
  process.exit();
}

if (args.length < 4) {
  exit('\nERROR: syntax: buildApiJson source target');
}

const rootDirectory = path.resolve(__dirname, '../../');
const docsApiDirectory = path.resolve(rootDirectory, args[3]);
const theme = createMuiTheme();

const inheritedComponentRegexp = /\/\/ @inheritedComponent (.*)/;

function getInheritance(testInfo, src) {
  let inheritedComponentName = testInfo.inheritComponent;

  if (inheritedComponentName == null) {
    const match = src.match(inheritedComponentRegexp);
    if (match !== null) {
      inheritedComponentName = match[1];
    }
  }

  if (inheritedComponentName == null) {
    return null;
  }

  let pathname;

  switch (inheritedComponentName) {
    case 'Transition':
      pathname = 'https://reactcommunity.org/react-transition-group/#Transition';
      break;

    default:
      pathname = `/api/${kebabCase(inheritedComponentName)}`;
      break;
  }

  return {
    component: inheritedComponentName,
    pathname,
  };
}

async function buildDocs(componentObject) {
  const src = readFileSync(componentObject.filename, 'utf8');

  if (src.match(/@ignore - internal component\./) || src.match(/@ignore - do not document\./)) {
    return;
  }

  const spread = !src.match(/ = exactProp\(/);

  // eslint-disable-next-line global-require, import/no-dynamic-require
  const component = require(componentObject.filename);
  const name = path.parse(componentObject.filename).name;
  const styles = {
    classes: [],
    name: null,
    descriptions: {},
  };

  if (component.styles && component.default.options) {
    // Collect the customization points of the `classes` property.
    styles.classes = Object.keys(getStylesCreator(component.styles).create(theme)).filter(
      className => !className.match(/^(@media|@keyframes)/),
    );
    styles.name = component.default.options.name;

    let styleSrc = src;
    // Exception for Select where the classes are imported from NativeSelect
    if (name === 'Select') {
      styleSrc = readFileSync(
        componentObject.filename.replace(
          `Select${path.sep}Select`,
          `NativeSelect${path.sep}NativeSelect`,
        ),
        'utf8',
      );
    }

    /**
     * Collect classes comments from the source
     */
    const stylesRegexp = /export const styles.*[\r\n](.*[\r\n])*};[\r\n][\r\n]/;
    const styleRegexp = /\/\* (.*) \*\/[\r\n]\s*(\w*)/g;
    // Extract the styles section from the source
    const stylesSrc = stylesRegexp.exec(styleSrc);

    if (stylesSrc) {
      // Extract individual classes and descriptions
      stylesSrc[0].replace(styleRegexp, (match, desc, key) => {
        styles.descriptions[key] = desc;
      });
    }
  }

  let reactAPI;
  try {
    reactAPI = docgenParse(src, null, defaultHandlers.concat(muiDefaultPropsHandler), {
      filename: componentObject.filename,
    });
  } catch (err) {
    console.log('Error parsing src for', componentObject.filename);
    throw err;
  }

  reactAPI.name = name;
  reactAPI.styles = styles;
  reactAPI.spread = spread;

  const testInfo = await parseTest(componentObject.filename);
  // no Object.assign to visually check for collisions
  reactAPI.forwardsRefTo = testInfo.forwardsRefTo;
  reactAPI.strictModeReady = testInfo.strictModeReady;

  reactAPI.filename = componentObject.filename.replace(rootDirectory, '');
  reactAPI.inheritance = getInheritance(testInfo, src);

  return reactAPI;
}

async function run() {
  const components = findComponents(path.resolve(rootDirectory, args[2]));

  const apis = (await Promise.all(
    components
      .map(async component => {
        try {
          return await buildDocs(component);
        } catch (error) {
          console.warn(`error building docs for ${component.filename}`);
          console.error(error);
          process.exit(1);
        }
      })
  )).filter(x => x);

  writeFileSync(docsApiDirectory, JSON.stringify(apis, null, 2));
}

run();
