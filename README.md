<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Mimy: Persistent Taste Mapping System

Mimy는 사용자의 음식 취향을 다차원으로 분석하여 개인화된 '맛의 지도'를 생성하고, 이를 기반으로 최적화된 클러스터 매칭 및 맛집 탐색을 제공하는 지능형 미식 플랫폼입니다.

## 🚀 주요 기능 (Core Features)

- **AI 취향 온보딩 (Multi-step Onboarding)**: 7가지 맛의 축(Boldness, Acidity, Richness, Experimental, Spiciness, Sweetness, Umami)을 기반으로 정교한 사용자 취향 프로필 생성
- **클러스터 매칭 (Taste Clustering)**: 7차원 맛 벡터 알고리즘을 통해 사용자를 가장 적합한 미식가 그룹(Cluster)에 매칭
- **맛집 탐색 (Discovery)**: 사용자의 취향 클러스터에 최적화된 맛집 탐색 및 큐레이션
- **마이 리스트 (MyList)**: 관심 있는 맛집을 저장하고 관리하는 개인화된 보관함
- **리뷰 시스템 (Review System)**: 상세한 평가와 이미지 업로드가 포함된 실시간 리뷰 작성 기능
- **다국어 지원 (i18n)**: 한국어와 영어를 포함한 글로벌 서비스 대응 (i18next 기반)

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19, Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Custom Design System)
- **Icons**: Lucide React
- **i18n**: i18next, react-i18next

### Backend
- **Framework**: Node.js, Express
- **Database**: SQLite 3 (Persistent Storage)
- **Runtime**: tsx (TypeScript Execution)
- **File Upload**: Multer (Image processing)

---

## 📂 Project Structure

### 🖥️ Frontend (`/src`)
- **`screens/`**: 애플리케이션의 주요 뷰 (Onboarding, Discovery, Profile, Review 등)
- **`components/`**: 고도로 모듈화된 UI 컴포넌트 (Modals, Buttons, Layouts)
- **`services/`**: API 통신(`ApiService.ts`), 사용자 비즈니스 로직(`UserService.ts`)
- **`locales/`**: 다국어 번역 데이터 (`ko.json`, `en.json`)
- **`context/`**: 전역 상태 관리를 위한 Auth/User Context
- **`utils/`**: 이미지 리사이징, 날짜 포맷팅 등 공통 유틸리티

### ⚙️ Backend (`/server`)
- **`routes/`**: 엔드포인트 도메인별 분리 (Shop, User, Review, Cluster, Keyword 등)
- **`controllers/`**: HTTP 요청 처리 및 비즈니스 로직 분기
- **`services/`**: 핵심 알고리즘 및 데이터 처리 (Taste Matching, DB Access)
- **`db/`**: SQLite 스키마 정의 및 초기 데이터 시딩 (`seeds.ts`)
- **`data/`**: 클러스터 기준 데이터 (TSV/JSON)

---

## 🛠️ Local Development

### Prerequisites
- Node.js (v20+)
- npm

### Setup & Run
1. **의존성 설치**:
   ```bash
   npm install
   ```
2. **개발 모드 실행 (Concurrent)**:
   - Frontend (Vite): `npm run dev` (Default Port: 5173)
   - Backend (Express): `npm run server` (Default Port: 3001)

3. **데이터베이스 초기화**:
   - 서버 최초 실행 시 `server/db/database.ts`와 `seeds.ts`를 통해 SQLite DB가 자동으로 생성 및 시딩됩니다.

---

## 🔄 Core Algorithm: Taste Mapping
Mimy의 핵심 매칭 엔진은 사용자의 응답을 7차원 벡터공간 상의 좌표로 변환합니다. `ClusterService`는 이 좌표와 사전에 정의된 클러스터 중심점 간의 유클리드 거리를 계산하여 가장 유사한 미식 그룹을 찾아냅니다.

---

View your app in AI Studio: [Mimy App](https://ai.studio/apps/drive/1wnXyvw4Hz9JZSMKSDNHtuSuZ7XjRVUEm)
