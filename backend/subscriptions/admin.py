from django.contrib import admin
from .models import Subscription # 💡 구독 모델 import

admin.site.register(Subscription) # 💡 구독 모델 등록