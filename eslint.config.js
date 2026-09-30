// ESLint flat config — https://eslint.org/docs/latest/use/configure/
import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/"] },
  js.configs.recommended,
  {
    files: ["public/js/**/*.js"],
    languageOptions: { sourceType: "module", globals: globals.browser },
  },
  {
    files: ["public/sw.js"],
    languageOptions: { sourceType: "script", globals: globals.serviceworker },
  },
  {
    files: ["scripts/**/*.mjs", "tests/**/*.js", "eslint.config.js"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];
