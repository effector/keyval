/** @type Partial<import('stylelint').Configuration> */
const config = {
  extends: [
    'stylelint-config-standard',
    'stylelint-config-xo-scss',
    'stylelint-config-xo-space',
    'stylelint-config-sass-guidelines',
    'stylelint-config-rational-order',
    'stylelint-config-prettier',
  ],
  rules: {
    // Selectors should be lowercase with hyphens, may have __postfixes
    'selector-class-pattern': '^[a-z0-9\\-]+(__[a-z0-9\\-]+)*$',
    // Use stylelint-config-rational-order instead
    'order/properties-alphabetical-order': null,
    'selector-max-id': 3,
    'max-nesting-depth': [
      3,
      {
        ignoreAtRules: ['each', 'media', 'supports', 'include'],
        ignore: ['pseudo-classes'],
      },
    ],
    // Fix bugged `value-keyword-case` rule (allow "." and "[")
    'value-keyword-case': [
      'lower',
      {
        // eslint-disable-next-line unicorn/better-regex, no-useless-escape
        ignoreKeywords: [/^.*[.\[].*$/],
      },
    ],
    // Fix bugged `value-keyword-case` rule (allow to use "myVar.toString()")
    'function-name-case': [
      'lower',
      {
        ignoreFunctions: [/^.*\.toString$/],
      },
    ],
    // Fix disallowed "border: none";
    'declaration-property-value-disallowed-list': {
      border: [0],
      'border-top': [0],
      'border-right': [0],
      'border-bottom': [0],
      'border-left': [0],
    },
    'comment-word-blacklist': null,
    // Fix "100%" notation
    'alpha-value-notation': 'number',
  },
};

module.exports = config;
