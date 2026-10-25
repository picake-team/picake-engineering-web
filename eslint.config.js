const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const pluginImport = require("eslint-plugin-import");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/*.d.ts",
      "**/.yarn/**",
      ".eslintcache",
      ".pnp.*",
      ".yarn/**",
      "eslint.config.js",
      "**/.next/**",
      "**/storybook-static/**",
    ],
  },
  js.configs.recommended,
  {
    // 로컬 개발용 Node 스크립트 (NestJS 밖에서 Prisma만 직접 사용)
    files: ["apps/*/scripts/**/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "writable",
        exports: "writable",
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: pluginImport,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Import 관련 규칙
      "import/no-unresolved": "off", // 모노레포 환경에서 절대 경로 import 허용

      // 변수 관련 규칙
      "no-undef": "off", // TypeScript가 타입 체크를 하므로 비활성화
      "@typescript-eslint/no-unused-vars": "warn", // 사용하지 않는 변수 사용 시 경고

      // 코드 스타일 관련 규칙 (경고로 설정)
      "@typescript-eslint/no-explicit-any": "off", // any 타입
      "@typescript-eslint/no-non-null-assertion": "off", // non-null assertion
      "@typescript-eslint/no-var-requires": "off", // require()

      // 함수 관련 규칙
      "@typescript-eslint/explicit-function-return-type": "off", // 함수 반환 타입 명시 강제하지 않음
      "@typescript-eslint/explicit-module-boundary-types": "off", // 모듈 경계 타입 명시 강제하지 않음

      // 기타 규칙
      "prefer-const": "warn", // 재할당되지 않는 변수는 const 사용 권장
      "no-console": "off", // console 사용 허용
      "no-debugger": "off", // debugger 사용 허용
    },
  },
  prettier,
];
