# Production CEW Camera

카메라팀이 최신 촬영 장비 소식과 출시 일정을 한눈에 확인할 수 있도록 만든 프론트엔드 대시보드입니다.

## 현재 포함된 기능

- 장비 대시보드 요약 카드
- 주요 업데이트 목록
- 장비 검색 / 브랜드 / 카테고리 / 상태 필터
- Supabase 연동 기반 장비 데이터 조회
- Supabase 연결이 없을 때 데모 데이터 fallback

## 기술 스택

- React 19
- TypeScript
- Vite
- shadcn/ui 스타일 컴포넌트
- Supabase

## 실행 방법

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 값을 설정하세요.

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Supabase 환경 변수가 없으면 앱은 자동으로 데모 데이터를 표시합니다.

### 3) 개발 서버 실행

```bash
npm run dev
```

기본 포트: `3000`

## 빌드

```bash
npm run build
```

## 타입 체크

```bash
npm run lint
```

## 데이터 테이블 예시

앱은 `equipment` 테이블을 기준으로 데이터를 읽습니다.

주요 컬럼 예시:

- `id`
- `brand`
- `model`
- `category`
- `announced_at`
- `release_date`
- `status`
- `summary`
- `official_url`
- `manual_url`
- `firmware_url`
- `is_published`
- `featured`
- `created_at`

## 개선 권장 사항

다음 단계로는 아래 작업을 추천합니다.

1. 실제 공식 장비 링크/출시 데이터 정제
2. Supabase 스키마 및 RLS 정책 정리
3. 관리자 입력 페이지 추가
4. 공식 뉴스/RSS/크롤러 수집 파이프라인 연결
5. 번들 크기 최적화
