# 구아바(구독서비스 정보 모아봐) 브랜치 전략 안내

이 문서는 구아바 프로젝트 팀원들이 사용할 브랜치 전략을 정리한
가이드입니다.\
기능별 브랜치를 나누어 협업을 효율적으로 진행하고, **main 브랜치는 항상
안정적인 코드만 유지**합니다.

------------------------------------------------------------------------

## 🌱 브랜치 기본 구조

-   **main** : 배포 가능한 안정된 코드만 유지
-   **develop** : (선택) 기능 통합 테스트용
-   **feature/**\* : 기능별 개발 브랜치
-   **fix/**\* : 버그 수정 브랜치
-   **hotfix/**\* : 운영 중 긴급 수정 브랜치
-   **release/**\* : 배포 준비 브랜치

------------------------------------------------------------------------

## 🖥️ 역할별 브랜치

  구분   브랜치명                       설명
  ------ ------------------------------ ----------------------
  FE     feature/fe-auth-ui             회원가입/로그인 UI
  FE     feature/fe-service-list        서비스 검색/필터 UI
  FE     feature/fe-subscription-ui     내 구독 리스트 UI
  BE     feature/be-auth-api            회원가입/로그인 API
  BE     feature/be-service-api         서비스 검색/상세 API
  BE     feature/be-subscription-crud   구독 CRUD API
  DB     feature/db-schema              DB 스키마/ERD 설계
  DB     feature/db-init-data           초기 데이터 입력

------------------------------------------------------------------------

## 📌 브랜치 운영 규칙

1.  **새 작업 시작 전**

    ``` bash
    git checkout main
    git pull origin main
    ```

    → 항상 main 최신화

2.  **작업 브랜치 생성**

    ``` bash
    git checkout -b feature/브랜치명
    ```

3.  **작업 후 커밋 & 푸시**

    ``` bash
    git add .
    git commit -m "feat: 기능 설명 (#이슈번호)"
    git push origin feature/브랜치명
    ```

4.  **PR 생성**

    -   GitHub에서 Pull Request 생성\
    -   코드 리뷰 후 main에 merge

5.  **머지 후 동기화**

    ``` bash
    git checkout main
    git pull origin main
    ```

6.  **브랜치 정리**

    ``` bash
    git branch -d feature/브랜치명
    git push origin --delete feature/브랜치명
    ```

    → 사용 끝난 브랜치는 로컬/원격 모두 삭제

------------------------------------------------------------------------

✅ 이 전략을 따르면 팀원들이 각자 맡은 기능을 독립적으로 개발하고,
충돌을 최소화하며 협업할 수 있습니다.
