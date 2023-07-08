const { getESLintConfig } = require('moga-lint');

module.exports = getESLintConfig('common-ts', {
    rules: {
        "@typescript-eslint/consistent-type-assertions": "off"
    }
});