import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    // env.js is a Node build-time config file (t3-env) — allow its Node globals.
    files: ["env.js"],
    languageOptions: {
      globals: { process: "readonly" },
    },
  },
];
