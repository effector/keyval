const micromatch = require('micromatch')

const codePattern = '**/*.{js,jsx,ts,tsx}'
const stylePattern = '**/*.{css,scss,html}'

/** @type Object.<string, function(string[]): string | string[]> */
module.exports = {
  '*': (files) => {
    const all = files.join(' ')
    const code = micromatch(files, codePattern).join(' ')
    const style = micromatch(files, stylePattern).join(' ')

    return [
      code && 'tsc -p tsconfig.json',
      code && `eslint --fix --quiet ${code}`,
      style && `stylelint --fix --quiet ${style}`,
      all && `prettier --write --ignore-unknown --loglevel warn ${all}`,
      code && `yarn test --bail --ci --cache --findRelatedTests ${code}`,
    ].filter(Boolean)
  },
}
