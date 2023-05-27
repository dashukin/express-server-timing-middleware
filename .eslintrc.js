module.exports = {
  extends: [
    'airbnb',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:jest/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:compat/recommended',
    'prettier',
  ],
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['babel', 'import', '@typescript-eslint', 'filenames', 'jest', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
        trailingComma: 'all',
      },
    ],
    'class-methods-use-this': 'off',
    'import/namespace': 'warn',
    'import/prefer-default-export': 'warn',
    'import/no-extraneous-dependencies': 'off',
    'import/no-relative-packages': 'warn',
    'import/no-unresolved': 'warn',
    'no-underscore-dangle': 'off',
    'no-use-before-define': [
      'error',
      {
        functions: false,
        classes: true,
        variables: true,
        allowNamedExports: false,
      },
    ],
    'no-restricted-exports': 'warn',
    'max-classes-per-file': 'warn',
    'default-param-last': 'warn',
    'prefer-regex-literals': 'warn',
    'jest/no-mocks-import': 'warn',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'no-await-in-loop': 'off',
    'lines-between-class-members': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
  settings: {
    polyfills: [
      'Promise',
     ],
    'import/resolver': {
      webpack: {
        config: './config/webpack/webpack.config.client.babel.js',
      },
      node: {
        extensions: ['.ts'],
      },
    },
    'import/extensions': ['.js', '.mjs', '.ts'],
  },
};
