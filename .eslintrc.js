module.exports = {
  env: {
    node: true,
    es2022: true,
    commonjs: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  rules: {
    // Code style
    indent: ["error", 2],
    quotes: ["error", "double"],
    semi: ["error", "always"],
    "comma-dangle": ["error", "always-multiline"],
    "no-trailing-spaces": "error",
    "eol-last": "error",

    // Variables
    "no-var": "error",
    "prefer-const": "error",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],

    // Functions
    "prefer-arrow-callback": "error",
    "arrow-spacing": "error",
    "no-duplicate-imports": "error",

    // Objects & Arrays
    "object-curly-spacing": ["error", "always"],
    "array-bracket-spacing": ["error", "never"],
    "object-shorthand": "error",

    // Strings
    "template-curly-spacing": "error",
    "no-useless-concat": "error",

    // Control flow
    "no-else-return": "error",
    "no-nested-ternary": "error",
    "prefer-template": "error",

    // Best practices
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "no-console": "warn",
    "no-debugger": "error",

    // ES6+ features
    "prefer-destructuring": [
      "error",
      {
        array: true,
        object: true,
      },
    ],
    "prefer-spread": "error",
    "prefer-rest-params": "error",

    // Async/Await
    "no-async-promise-executor": "error",
    "require-await": "error",

    // MongoDB specific
    "new-cap": "off", // Allow mongoose models like User()

    // Relaxed rules for development
    "no-unused-vars": "warn",
    "no-console": "off", // Allow console.log in development
  },
  overrides: [
    {
      // Test files
      files: ["**/*.test.js", "**/*.spec.js"],
      env: {
        jest: true,
      },
      rules: {
        "no-console": "off",
      },
    },
    {
      // Config files
      files: ["*.config.js"],
      rules: {
        "no-console": "off",
      },
    },
  ],
  ignorePatterns: ["node_modules/", "dist/", "build/", "coverage/", "*.min.js"],
};
