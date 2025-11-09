module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    // Don't use project for test files as they're excluded from tsconfig
    project: './tsconfig.json',
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.*', '**/*.spec.*'],
      parserOptions: {
        project: null,
      },
    },
  ],
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
  ],
  settings: {
    react: {
      version: '18.0',
    },
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'warn',
      {
        prefer: 'type-imports',
      },
    ],

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 18+
    'react/prop-types': 'off', // Using TypeScript for prop validation
    'react/display-name': 'off',

    // React Hooks rules (critical for hooks library!)
    'react-hooks/rules-of-hooks': 'error', // Enforce hooks rules
    'react-hooks/exhaustive-deps': 'warn', // Check effect dependencies

    // General code quality
    'no-console': 'warn',
    'no-debugger': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'multi-line'],

    // Allow unused vars that start with underscore
    'no-unused-vars': 'off', // Using @typescript-eslint/no-unused-vars instead
  },
  ignorePatterns: [
    'dist',
    'build',
    'node_modules',
    '*.config.js',
    '*.config.cjs',
    'coverage',
  ],
};
