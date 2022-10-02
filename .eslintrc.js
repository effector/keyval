/** @type import('eslint').Linter.Config */
const config = {
  extends: ['./eslint.config.base'],
  // Project specific rules
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
  },
}

module.exports = config
