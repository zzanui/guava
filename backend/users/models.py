# users/models.py
from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.conf import settings
#사용자 관리
class UserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        if not username:
            raise ValueError("username은 필수입니다.")
        user = self.model(username=username, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    # 관리자 개념 안 쓸 거면 써도 되고 안 써도 됩니다.
    def create_superuser(self, username, password=None, **extra_fields):
        if not password:
            raise ValueError("슈퍼유저는 비밀번호가 필요합니다.")
        return self.create_user(username, password, **extra_fields)
#사용자
class User(AbstractBaseUser):
    user_id = models.BigAutoField(primary_key=True)              # PK
    username = models.CharField(max_length=50, unique=True)      # 아이디(로그인 식별자)
    email = models.EmailField(null=True, blank=True)             # 이메일(선택, 고유 제약 필요시 unique=True)
    password = models.CharField(max_length=128)                  # 비밀번호 해시
    social_id = models.CharField(max_length=100, null=True, blank=True, unique=True)  # 네이버/카카오 등
    name = models.CharField(max_length=50)                       # 사용자 이름
    display_name = models.CharField(max_length=50)               # 닉네임
    created_at = models.DateTimeField(auto_now_add=True)         # 생성일

    objects = UserManager()

    # 로그인 식별자 변경: username
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = []   # createsuperuser 시 추가로 물을 필드지만 관리자계정 필드는 별도로 관리할 예정이므로 필요없음

    class Meta:
        db_table = "user"  # 팀 테이블명과 일치해야하므로 추후 수정

    # 권한/활성화 컬럼을 안 쓰므로 속성으로 True 반환(인증 흐름 호환용)
    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_active(self):
        return True  # 컬럼 없이 항상 활성 처리
    
    @property
    def id(self):        # read-only alias
        return self.user_id



