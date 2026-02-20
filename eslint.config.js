import globals from "globals";
import pluginJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import pluginReact from "eslint-plugin-react";

export default [
  {files: ["**/*.{js,mjs,cjs,ts,tsx}"]},
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: { 
        ecmaFeatures: { jsx: true }, 
        ecmaVersion: "latest", 
        sourceType: "module" 
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  pluginJs.configs.recommended,
  ...tsPlugin.configs.recommended,
  {
    ...pluginReact.configs.recommended,
    settings: {
      react: {
        version: "detect"
      }
    }
  },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "@typescript-eslint/no-explicit-any": "off" // 'any' kullanımına izin ver
    }
  }
];
