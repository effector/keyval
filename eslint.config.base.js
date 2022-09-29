/** @type import('@typescript-eslint/types').ParserOptions */
const parserOptions = {
  sourceType: 'module',
  ecmaVersion: 2020,
  project: './tsconfig.json',
  tsconfigRootDir: './',
  warnOnUnsupportedTypeScriptVersion: true,
}

/** @type import('eslint').Linter.Config */
const config = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions,
  env: {
    es2021: true,
    browser: true,
    worker: true,
    node: true,
    jest: true,
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  extends: [
    'plugin:unicorn/recommended',
    'plugin:jest/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/recommended',
    'xo-space',
    'xo-react/space',
    'xo-typescript/space',
    'airbnb',
    'airbnb/hooks',
    'airbnb-typescript',
    'prettier',
  ],
  overrides: [
    // TypeScript
    {
      files: ['**/*.ts', '**/*.tsx'],
      plugins: ['simple-import-sort'],
      rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'sort-imports': 'off',
        'import/order': 'off',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
      },
    },
    // JSX
    {
      files: ['src/**/*.jsx', 'src/**/*.tsx'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
      },
    },
    // Root configs
    {
      files: ['./*.js'],
      rules: {
        'unicorn/prefer-module': 'off',
        'simple-import-sort/imports': 'off',
        'import/order': ['error', {'newlines-between': 'always'}],
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        // Warnings
        '@typescript-eslint/no-implicit-any-catch': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/restrict-template-expressions': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
      },
    },
  ],
  rules: {
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          './*.js',
          'src/**/*.test.js',
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
        ],
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    'no-plusplus': ['error', {allowForLoopAfterthoughts: true}],
    'no-restricted-syntax': [
      'error',
      'LabeledStatement',
      'WithStatement',
      'SequenceExpression',
    ],
    'no-restricted-imports': ['error', {patterns: ['../*']}],
    'unicorn/prevent-abbreviations': [
      'error',
      {
        allowList: {
          args: true,
          ref: true,
          Ref: true,
          props: true,
          Props: true,
          dev: true,
          Dev: true,
          prod: true,
          Prod: true,
          env: true,
          Env: true,
          params: true,
          Params: true,
          param: true,
          Param: true,
          config: true,
          Config: true,
          Fn: true,
          fn: true,
        },
      },
    ],
    'unicorn/no-null': 'off',
    'unicorn/no-fn-reference-in-iterator': 'off',
    'react/jsx-filename-extension': ['error', {extensions: ['.jsx', '.tsx']}],
    'react/require-default-props': [
      'warn',
      {
        forbidDefaultForRequired: true,
        ignoreFunctionalComponents: true,
      },
    ],
  },
}

module.exports = config
