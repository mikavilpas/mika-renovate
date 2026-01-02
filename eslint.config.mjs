import eslintConfigPrettier from "eslint-config-prettier"
import eslintPluginImportX from "eslint-plugin-import-x"
import noOnlyTests from "eslint-plugin-no-only-tests"
import oxlint from "eslint-plugin-oxlint"
import { defineConfig } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig([
  {
    ignores: ["eslint.config.mjs"],
  },

  tseslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,

  {
    plugins: {
      "no-only-tests": noOnlyTests,
    },

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: true,
      },
    },

    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
      "no-only-tests/no-only-tests": "warn",
      "@typescript-eslint/require-await": "off",
      "object-shorthand": "warn",

      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Don't declare enums",
        },
      ],

      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/explicit-module-boundary-types": ["warn"],
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": ["error"],

      "lines-between-class-members": [
        "error",
        "always",
        {
          exceptAfterSingleLine: true,
        },
      ],

      "no-empty-function": [
        "error",
        {
          allow: ["constructors"],
        },
      ],

      "no-return-await": "off",
      "@typescript-eslint/return-await": "error",
      "no-useless-constructor": "off",

      "no-void": [
        "error",
        {
          allowAsStatement: true,
        },
      ],

      "@typescript-eslint/no-unused-vars": "off",

      "import-x/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: ["**/*.test.ts"],
          optionalDependencies: false,
        },
      ],
    },
  },

  ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
  // should be the last item, https://github.com/prettier/eslint-config-prettier?tab=readme-ov-file#installation
  eslintConfigPrettier,
])
