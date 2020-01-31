module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base'
    // 'plugin:@typescript-eslint/recommended'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'semi': ['error', 'never'],
    'arrow-parens': 'off',
    'no-unused-vars': 'off',
    'import/no-unresolved': 'warn',
    'import/extensions': 'warn',
    'max-len': 'warn',
    'no-underscore-dangle': 'off',
    'default-case': 'off',
    'consistent-return': 'off'
  },
};
