import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Безопасно создаёт (или обновляет пароль) суперпользователя из переменных
    окружения. Можно запускать при каждом старте сервера — если пользователь
    уже существует, ничего не ломает, просто ничего не делает.

    Нужны переменные окружения:
        DJANGO_SUPERUSER_USERNAME
        DJANGO_SUPERUSER_EMAIL
        DJANGO_SUPERUSER_PASSWORD
    """

    help = "Создаёт суперпользователя из переменных окружения, если его ещё нет"

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(self.style.WARNING(
                "DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_PASSWORD не заданы — пропускаю."
            ))
            return

        User = get_user_model()

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.SUCCESS(
                f"Пользователь '{username}' уже существует — ничего не делаю."
            ))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(
            f"Суперпользователь '{username}' создан."
        ))