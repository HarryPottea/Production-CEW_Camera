# Production CEW Camera

카메라팀이 **브랜드 공식 뉴스 소스에서 장비 출시/발표 소식을 자동 수집**하고, 이를 한눈에 확인할 수 있도록 만든 대시보드입니다.

## 현재 포함된 기능

- 장비 대시보드 요약 카드
- 주요 발표 장비 큐레이션
- 장비 검색 / 브랜드 / 카테고리 / 상태 필터
- 공식 뉴스 링크 우선 연결
- 공식 뉴스 소스 수집 스크립트
- JSON 스냅샷 기반 프론트 표시

## 기술 스택

- React 19
- TypeScript
- Vite
- shadcn/ui 스타일 컴포넌트
- tsx 기반 수집 스크립트

## 데이터 구조

이 프로젝트는 **Supabase 없이도 동작**합니다.

자동 수집 결과는 아래 파일에 저장됩니다.

- `src/data/equipment.generated.json`

프론트는 이 파일을 직접 읽어 화면에 표시합니다.

## 자동 수집 소스

현재 수집기는 아래 소스를 대상으로 동작하도록 구성했습니다.

- Sony MediaRoom / HTML 아카이브
- Canon Global News / HTML 아카이브
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

### 2) 뉴스 자동 수집 실행

```bash
npm run sync:news
```

이 작업은:
- 공식 뉴스 피드 수집
- 키워드 필터링
- 항목 정규화
- `src/data/equipment.generated.json` 스냅샷 저장

을 수행합니다.

### 3) 개발 서버 실행

```bash
npm run dev
```

기본 포트: `3000`

## GitHub Actions 자동 실행

이 프로젝트에는 `.github/workflows/sync-news.yml` 이 포함되어 있습니다.

기본 설정:
- 수동 실행 가능 (`workflow_dispatch`)
- **6시간마다 자동 실행**

자동 실행 시 스냅샷 파일이 갱신되면 커밋/푸시됩니다.

## 빌드

```bash
npm run build
```

## 타입 체크

```bash
npm run lint
```

## 주요 필드

- `id`
- `brand`
- `model`
- `category`
- `announced_at`
- `release_date`
- `status`
- `summary`
- `news_url` (공식 뉴스/보도자료 링크)
- `product_url` (제품 상세 페이지 링크)
- `official_url` (레거시 호환용 링크)
- `manual_url`
- `firmware_url`
- `featured`
- `source_title`

## 현재 한계

- 브랜드별 뉴스 소스 구조가 달라 파서 보강이 더 필요할 수 있음
- 일부 항목은 여전히 제품 페이지가 아니라 상위 뉴스 경로일 수 있어 후속 정제가 필요함
- 현재 상태 분류(`발표`, `출시 예정`, `출시 완료`)는 기사 날짜 기반 추정 로직입니다
- 모델명 추출은 기사 제목 기반이라 후속 정제가 필요할 수 있습니다

## 다음 추천 작업

1. 브랜드별 기사 상세 URL 정밀 보정
2. RED / Sigma / Tamron / DJI 추가
3. 중복 제거 로직 강화
4. 썸네일/브랜드 이미지 연동
5. 모바일 레이아웃 최적화
