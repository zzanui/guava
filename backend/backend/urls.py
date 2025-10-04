from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/", include("services.urls")),
    path("api/my/", include("subscriptions.urls")),
    path("api/auth/", include("users.urls")),

    # --- API 문서 생성을 위한 URL 패턴들 ---

    # 1. API 스키마 파일(openapi.yaml)을 제공하는 URL (기계가 읽는 용도)
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # 2. Swagger UI를 통해 API 문서를 보여주는 URL (사람이 보는 용도, 가장 많이 사용)
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # 3. ReDoc UI를 통해 API 문서를 보여주는 URL (다른 스타일의 문서 UI)
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]