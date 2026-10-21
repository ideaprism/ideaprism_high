# IdeaPrism High

네 고등학교가 학교 코드로 각자 화면을 여는 IdeaPrism입니다. 검색, 상세, 특허 검색식은 `ideaprism_sdg2`와 같은 구조입니다.

## 학교 코드

| 학교 | 코드 |
| --- | --- |
| 부산 대광고등학교 | `DAEGWANG` |
| 서울 미래산업과학고등학교 | `MIRAE` |
| 수원 삼일공업고등학교 | `SAMIL` |
| 서울 보성고등학교 | `BOSEONG` |

코드는 `src/config/school-codes.ts`에서 바꿉니다. 학교 이름과 색은 `src/config/schools.ts`입니다.

## 실행

```bash
npm install
npm run dev
```

데이터베이스 접속 정보는 `.env.local`에 둡니다. 키 이름은 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ADMIN_SESSION_SECRET`입니다.
