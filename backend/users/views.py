# users/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, TokenError


User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        클라이언트에서 refresh 토큰을 body로 보내야 함.
        예: {"refresh": "<refresh_token>"}
        """
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "refresh 토큰이 필요합니다."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()  # DB에 블랙리스트 등록
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except TokenError:
            return Response({"detail": "유효하지 않은 토큰입니다."}, status=status.HTTP_400_BAD_REQUEST)