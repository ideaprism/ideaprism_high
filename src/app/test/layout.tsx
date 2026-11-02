import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';

// 실험용 화면 모음(/test/**) 가드 — 2026-08-10
// 실서비스(프로덕션 빌드)에서는 존재하지 않는 페이지처럼 404 처리하고,
// 로컬 개발 모드(npm run dev)에서는 참고용으로 그대로 접근할 수 있게 둔다.
export default function TestLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <>{children}</>;
}
