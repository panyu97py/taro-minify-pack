module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['off', {argsIgnorePattern: '^_'}], // 忽略未使用的参数（如果以 `_` 开头）
    "indent": ["error", 2, { "SwitchCase": 1 }], // 设置缩进为 4 空格
  },
};
