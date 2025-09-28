from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
User = get_user_model()

class UsernameBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username or not password:
            return None
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        return user if user.check_password(password) else None

    def get_user(self, user_pk):
        try: return User.objects.get(pk=user_pk)
        except User.DoesNotExist: return None
