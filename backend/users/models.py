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
            # 💡 2. 슈퍼유저는 is_staff와 is_superuser가 True여야 합니다.

        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, password, **extra_fields)
#사용자
class User(AbstractBaseUser):
    last_login = None   # ← 필드 제거

    user_id = models.BigAutoField(db_column="user_id", primary_key=True)              # PK
    username = models.CharField(db_column="user_name", max_length=50, unique=True)      # 아이디(로그인 식별자)
    email = models.EmailField(db_column="email", null=True, blank=True)             # 이메일(선택, 고유 제약 필요시 unique=True)
    password = models.CharField(db_column="password", max_length=128)                  # 비밀번호 해시
    social_id = models.CharField(db_column="social_id", max_length=100, null=True, blank=True, unique=True)  # 네이버/카카오 등
    name = models.CharField(db_column="name", max_length=50)                       # 사용자 이름
    display_name = models.CharField(db_column="display_name", max_length=50)               # 닉네임
    created_at = models.DateTimeField(db_column="created_at", auto_now_add=True)         # 생성일
    is_staff = models.BooleanField(db_column="is_staff", default=False)
    is_superuser = models.BooleanField(db_column="is_superuser", default=False)
    objects = UserManager()

    # 로그인 식별자 변경: username
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ['email']   # createsuperuser 시 추가로 물을 필드지만 관리자계정 필드는 별도로 관리할 예정이므로 필요없음

    class Meta:
        managed = False      # 테이블 건드리지 않음
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

    def has_perm(self, perm, obj=None):
        "특정 권한이 있습니까?"
        # 가장 간단한 구현: 슈퍼유저는 모든 권한을 가짐
        return self.is_superuser

    def has_module_perms(self, app_label):
        "특정 앱의 모델을 볼 권한이 있습니까?"
        # 가장 간단한 구현: 슈퍼유저는 모든 앱을 볼 수 있음
        return self.is_superuser