import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/build/**"] },
  ...tseslint.configs.recommended,
];
