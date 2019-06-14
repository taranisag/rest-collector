module.exports = {
    parser: "@typescript-eslint/parser", 
    extends: [
        "plugin:@typescript-eslint/recommended",
        "prettier/@typescript-eslint", 
        "plugin:prettier/recommended"
    ],
    parserOptions: {
      ecmaVersion: 2018, 
      sourceType: "module" 
    },
    rules: {
      "@typescript-eslint/no-explicit-any": false,
      "@typescript-eslint/no-parameter-properties": false,
      "@typescript-eslint/explicit-member-accessibility": false,
      "@typescript-eslint/explicit-function-return-type": false,
      "@typescript-eslint/no-non-null-assertion": false
    }
  };