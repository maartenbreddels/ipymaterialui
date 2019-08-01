module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
  ],
  rules: {
    'indent': ['error', 4, { 'SwitchCase': 1 }],
    'import/prefer-default-export': 'off',
    'camelcase': ["error", {allow: ['__webpack_public_path__', 'load_ipython_extension', '_model_name', 'unpack_models']}],
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'react/jsx-indent': ['error', 4],
  },
};
