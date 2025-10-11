### Swagger API 사용법

1. `python manage.py runserver` 로 테스트용 서버 구동
2. 브라우저로 `http://127.0.0.1:8000/api/schema/swagger-ui/#/` 에 접속


![swagger ui](./docs/img/swagger.jpg)

그럼 이런식으로 현재 사용 가능한 API들을 테스트해볼수 있습니다.<br>
위의 Authorize에 JWT를 부여해 로그인한 사용자를 기준으로 테스트도 가능합니다.