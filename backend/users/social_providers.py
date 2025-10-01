import requests

class KakaoVerifier:
    @staticmethod
    def get_profile(access_token: str) -> dict:
        # Kakao: Authorization: Bearer <access_token>
        resp = requests.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        resp.raise_for_status()
        data = resp.json()
        kakao_id = str(data["id"])
        # 이메일이 동의항목일 수 있음(없을 수도 있음)
        email = (data.get("kakao_account") or {}).get("email")
        name = (data.get("kakao_account") or {}).get("profile", {}).get("nickname")
        return {"provider": "kakao", "provider_user_id": kakao_id, "email": email, "name": name}

class NaverVerifier:
    @staticmethod
    def get_profile(access_token: str) -> dict:
        # Naver: Authorization: Bearer <access_token>
        resp = requests.get(
            "https://openapi.naver.com/v1/nid/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        resp.raise_for_status()
        data = resp.json()["response"]
        naver_id = str(data["id"])
        email = data.get("email")
        name = data.get("name") or data.get("nickname")
        return {"provider": "naver", "provider_user_id": naver_id, "email": email, "name": name}

class GoogleVerifier:
    @staticmethod
    def get_profile(id_token: str) -> dict:
        # Google: ID 토큰 검증(백엔드 검증). access_token이 아니라 id_token을 권장.
        resp = requests.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
        resp.raise_for_status()
        data = resp.json()
        sub = str(data["sub"])            # 고유 사용자 ID
        email = data.get("email")
        name = data.get("name") or data.get("given_name")
        # aud(클라이언트ID) 검증 필요: data["aud"]가 내 앱의 client_id인지 확인해야 안전
        return {"provider": "google", "provider_user_id": sub, "email": email, "name": name}