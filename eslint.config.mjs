import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next 15.x는 구형(eslintrc) 형식이라 FlatCompat으로 변환해서 사용한다.
// (16.x 전용 import 경로를 쓰면 모듈을 못 찾아 ESLint가 실행되지 않음)
const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
      // 참조용 외부 에셋 (빌드 미포함)
      "external_assets/**",
      "supabase/functions/**",
      "tag-chatbot-proto/**",
    ],
  },
];

export default eslintConfig;
