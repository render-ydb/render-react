const { getESLintConfig } = require('moga-lint');

module.exports = getESLintConfig('common-ts', {
    rules: {
        "@typescript-eslint/consistent-type-assertions": "off",
        "import/no-cycle":"off",
        "react/no-children-prop":"off",
        "import/named":"off",
        "no-return-assign":"off",
        "react-hooks/rules-of-hooks":"off",
        "@typescript-eslint/no-unused-expressions":"off"
    }
});