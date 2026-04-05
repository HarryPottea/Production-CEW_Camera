# Production CEW Camera

카메라팀이 **브랜드 공식 뉴스 소스에서 장비 출시/발표 소식을 자동 수집**하고, 이를 한눈에 확인할 수 있도록 만든 대시보드입니다.

## 현재 포함된 기능

- 장비 대시보드 요약 카드
- 주요 업데이트 목록
- 장비 검색 / 브랜드 / 카테고리 / 상태 필터
- Supabase 연동 기반 장비 데이터 조회
- 공식 뉴스 소스 수집 스크립트
- Supabase 연결이 없을 때 데모 데이터 fallback

## 기술 스택

- React 19
- TypeScript
- Vite
- shadcn/ui 스타일 컴포넌트
- Supabase
- tsx 기반 수집 스크립트

## 자동 수집 구조

현재 수집기는 아래 소스를 대상으로 동작하도록 구성했습니다.

- Sony MediaRoom / JSON
- Canon Global News / JSON
- Nikon 공식 RSS
- Blackmagic Design RSS

향후 추가 예정:

- RED
- Sigma
- Tamron
- DJI

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
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

- `VITE_SUPABASE_*` : 프론트에서 읽기용
- `SUPABASE_SERVICE_ROLE_KEY` : 수집 스크립트가 DB upsert할 때 사용

> Supabase 환경 변수가 없으면 앱은 자동으로 데모 데이터를 표시합니다.

### 3) Supabase 테이블 생성

`suoabase/schema.sql` 내용을 Supabase SQL Editor에서 실행하세요.

### 4) 뉴스 자동 수집 실행

```bash
npm run sync:news
```

이 작업은:
- 공식 뉴스 피드 수집
- 키워드 필터링
- 항목 정규화
- `src/data/equipment.generated.json` 스냅샷 저장
- Supabase `equipment` 테이블 upsert

을 수행합니다.

### 5) GitHub Actions 자동 실행 설정

이 프로젝트에는 `.github/workflows/sync-news.yml` 이 포함되어 있습니다.

기본 설정:
- 수동 실행 가능 (`workflow_dispatch`)
- **6시간마다 자동 실행**

GitHub 저장소의 **Settings → Secrets and variables → Actions** 에 아래 시크릿을 등록하세요.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> 시크릿이 없으면 스냅샷 파일 갱신은 가능하지만 Supabase 업서는 동작하지 않습니다.

### 6) 개발 서버 실행

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

## 데이터 테이블 구조

앱은 `equipment` 테이블을 기준으로 데이터를 읽습니다.

주요 컬럼:

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
- `source_title`
- `created_at`

## 현재 한계

- 브랜드별 뉴스 소스 구조가 달라 파서 보강이 더 필요할 수 있음
- 일부 브랜드는 RSS/공식 JSON이 없어 HTML 파서 추가가 필요함
- 현재 상태 분류(`발표`, `출시 예정`, `출시 완료`)는 기사 날짜 기반 추정 로직입니다
- 모델명 추출은 기사 제목 기반이라 후속 정제가 필요할 수 있습니다

## 다음 추천 작업

1. 브랜드별 파서 정교화
2. RED / Sigma / Tamron / DJI 추가
3. 중복 제거 로직 강화
4. 관리자 큐레이션 페이지 추가
5. cron / GitHub Actions로 정기 수집 자동화
