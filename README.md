# 구아바(Guava) – 구독 모아봐
> 다양한 구독 서비스를 한 곳에서 관리하고 비교하는 통합 구독 관리 플랫폼  
> 개발기간: 2025.09 ~ 2025.10  
> 참여인원: 4인  
> 역할: 설계 · Backend 개발 · 배포  
> 시연영상: https://drive.google.com/file/d/18pTg4zP2ZEhM2ki5XZ6XDmeui2GTxQz6/view?usp=drive_link

<div align="center">
  <img width="701" height="378" alt="메인페이지" src="https://github.com/user-attachments/assets/fc1852cd-ed0d-4c0c-97a6-96213bb3064d" />
</div>

---
## UI


<details>
  <summary>서비스조회</summary>
    <img width="616" height="527" alt="서비스조회1" src="https://github.com/user-attachments/assets/a0d1e03b-2436-40ea-85bd-9fa35bb76a68" />
    <img width="504" height="326" alt="서비스조회2" src="https://github.com/user-attachments/assets/ddce3556-b808-4742-b7c5-60e784d69954" />
</details>

<details>
  <summary>가격비교</summary>
    <img width="615" height="526" alt="가격비교1" src="https://github.com/user-attachments/assets/a3350a98-5744-4b7a-b8ca-de3b74b1764f" />
    <img width="622" height="551" alt="가격비교2" src="https://github.com/user-attachments/assets/692b8314-0ad1-4d62-96f3-c0bbaab98375" />
    <img width="704" height="533" alt="가격비교3" src="https://github.com/user-attachments/assets/1c8d3cf5-e0b0-4305-a8e6-5d5d1d69459b" />
</details>

<details>
  <summary>구독관리</summary>
    <img width="416" height="415" alt="구독관리1" src="https://github.com/user-attachments/assets/680af3f4-4ce0-4a14-a24e-020c33cfd02e" />
    <img width="335" height="369" alt="구독관리2" src="https://github.com/user-attachments/assets/7f49c363-223f-4c61-963c-7e402e59cbab" />
    <img width="633" height="442" alt="구독관리3" src="https://github.com/user-attachments/assets/a97c381d-8fa6-43fb-a7c7-1f2ad33ac609" />
    <img width="603" height="425" alt="구독관리4" src="https://github.com/user-attachments/assets/dc61953e-f132-4752-984e-f505e3dec4bf" />
</details>

---

## 프로젝트 개요
구아바(Guava)는 OTT, 음악, 전자책, 식품 등 다양한 **구독 서비스의 가격, 혜택, 결제주기**를  
한 곳에서 비교·관리할 수 있는 플랫폼입니다.  
사용자는 월 지출액을 통합적으로 확인하고 불필요한 구독을 쉽게 제거하여  
**합리적인 소비 결정**을 내릴 수 있습니다.  

---

## 프로젝트 목표
- 구독 서비스 종류가 증가하면서 관리가 어려워진 문제 해결  
- 여러 플랫폼을 직접 방문해야 하는 비효율 개선  
- 가격/혜택 데이터 수집 및 시각화를 통한 소비 최적화 지원  


---

## 핵심 가치
- **통합 관리**: 여러 구독 정보를 한 화면에서 관리  
- **가격 비교**: 서비스·요금제 가격을 한눈에 비교  
- **지출 최적화**: 카테고리별 지출 시각화  
- **구독 리포트 제공**: 사용자 맞춤 월간 리포트  


---

## 기술 스택

| 구분 | 기술 | 설명 |
|------|------|------|
| Backend | Django REST Framework | API 서버 구축 |
| Frontend | React (TS + Vite) | SPA 기반 UI |
| Database | MariaDB / AWS RDS | 사용자 및 서비스 데이터 |
| Infra | Docker, Docker Compose | 컨테이너 기반 배포 |
| Server | AWS EC2 | HTTP 서비스 운영 |
| Web Server | Nginx + Certbot | Reverse Proxy |

---

## 내 역할 요약
- Django REST Framework 기반 **핵심 모델 및 CRUD 개발**
- User · Service · Plan · Subscription 등 데이터 모델 설계
- AWS EC2 + RDS + Docker Compose 기반 배포
- 팀 전체의 개발 환경을 통일하고, 공용 API Gateway 역할을 담당
- RDS 도입으로 데이터 일관성 및 운영 환경 안정성 확보  

---

## 시스템 아키텍처
[React] ⇄ [Nginx] ⇄ [Gunicorn + Django API] ⇄ [PostgreSQL]
 <div align="center">
    <img width="783" height="433" alt="아키텍처" src="https://github.com/user-attachments/assets/868faee0-8cd6-4f93-9cdc-1369958a31f4" />
  </div>

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 구독 서비스 관리 | 사용자가 이용 중인 구독을 등록·관리하고 실시간 총 지출액 확인 |
| 가격 비교 | 다양한 요금제 및 혜택을 한눈에 비교 |
| 데이터 분석·시각화 | 월별 카테고리별 구독 통계를 차트로 제공 |

---

## 개발 환경 설계
> **고정된 EC2 API 서버 + 관리형 DB(RDS)** 구조로 팀의 환경 일관성을 유지  
- 프론트는 로컬 개발  
- 백엔드는 EC2에서 공용 API 제공  
- 실제 배포 환경과 유사한 테스트 가능  

---

## ERD 구조 요약

- 관리자/사용자 테이블 별도 분리  
- User → Subscription → Plan → Service 연결 구조  
- **PlanPriceHistory** 로 과거 가격 재현 및 통계 가능  
- **ServiceStats + 인덱스 최적화** 로 조회 성능 개선  
- **price_override, Bookmark** 등 개인화 기능  
- 향후 번들/쿠폰/결제 로그 등 확장이 가능한 구조

  
 <div align="center">
    <img width="512" height="293" alt="erd" src="https://github.com/user-attachments/assets/d4aaf2d0-629e-47f6-9acf-0d447eba6ce9" />
  </div>


---

## API 요약표

### 인증 (Auth)
| 기능 | 엔드포인트 | 메서드 | 주요 필드 |
|------|------------|--------|-----------|
| 로그인 | `/api/auth/login/` | POST | username, password |
| 토큰 갱신 | `/api/auth/refresh/` | POST | refresh |

---

### 구독 서비스 (Service)
| 기능 | 엔드포인트 | 메서드 | 주요 필드 |
|------|------------|--------|-----------|
| 서비스 조회 | `/api/services/` | GET | name, category |

---

### 요금제 (Plan)
| 기능 | 엔드포인트 | 메서드 |
|------|------------|--------|
| 요금제 조회 | `/api/plans/` | GET |

---

### 내 구독 (Subscription)
| 기능 | 엔드포인트 | 메서드 |
|------|------------|--------|
| 내 구독 조회 | `/api/my/subscriptions/` | GET |
| 구독 등록 | `/api/my/subscriptions/` | POST |
| 구독 수정 | `/api/my/subscriptions/{id}/` | PATCH |
| 구독 삭제 | `/api/my/subscriptions/{id}/` | DELETE |

---

### 리포트 (Report)
- PDF 리포트 다운로드  
- `/api/my/subscriptions/export_pdf/` (GET)

---

### 즐겨찾기 (Bookmark)
| 기능 | 엔드포인트 | 메서드 |
|------|------------|--------|
| 관심 서비스 등록 | `/api/my/bookmarks/` | POST |
| 관심 서비스 조회 | `/api/my/bookmarks/` | GET |

---

## 배포 및 운영 과정

- Docker Compose(backend + db + nginx) 기반 배포  
- EC2 22/80/443 포트 오픈  
- Certbot SSL 인증서 적용  
- Docker 이미지 빌드 후 바로 배포  
- Django 로깅으로 접근 기록 관리  
- 테스트용 8000 포트는 이후 차단  
- Swap 4GB 추가하여 OOM 문제 해결  

---

## 협업 환경

- 백엔드는 EC2·RDS 기반 클라우드 통합 환경 구축  
- 프론트는 로컬에서 즉시 API 호출 가능  
- 협업 과정에서 GitHub 브랜치 전략 도입  
- 기획·ERD·API 문서 지속 업데이트  

---

## 개선 및 향후 계획

### 서비스 측면
- 결제일 알림 강화  
- 결제 내역 자동 연동  
- 소비 패턴 기반 구독 추천 기능  

### 기술 측면
- CI/CD 자동화 구축  
- 크롤링 기반 가격 데이터 자동 수집  
- Cloudflare/Akamai 기반 DDoS 방어  
- 기업용 구독 관리 **SaaS 모델 확장**  

---

## 회고

- 팀 협업과 프로세스의 중요성 체감  
- 일정 관리·문서화의 힘을 배움  
- Docker 네트워크 및 AWS 인프라 실전 운영 경험  
- 하나의 기능보다 팀워크가 서비스 완성도에 더 큰 영향을 준다는 점을 실감  

---
