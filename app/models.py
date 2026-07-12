from django.core.exceptions import ValidationError
from django.db import models


class Car(models.Model):

    CLASS_CHOICES = [
        ("Эконом", "Эконом"),
        ("Комфорт", "Комфорт"),
        ("Бизнес", "Бизнес"),
        ("Внедорожник", "Внедорожник"),
        ("Премиум", "Премиум"),
    ]

    name = models.CharField(
        "Название автомобиля",
        max_length=100
    )

    car_class = models.CharField(
        "Класс автомобиля",
        max_length=30,
        choices=CLASS_CHOICES
    )

    plate = models.CharField(
        "Государственный номер",
        max_length=20
    )

    price = models.PositiveIntegerField(
        "Цена за сутки ($)"
    )

    engine = models.CharField(
        "Двигатель",
        max_length=100
    )

    gearbox = models.CharField(
        "Коробка передач",
        max_length=100
    )

    seats = models.PositiveIntegerField(
        "Количество мест"
    )

    fuel = models.CharField(
        "Тип топлива",
        max_length=50
    )

    consumption = models.CharField(
        "Расход топлива",
        max_length=50
    )

    year = models.PositiveIntegerField(
        "Год выпуска"
    )

    image = models.ImageField(
        "Фото автомобиля",
        upload_to="cars/"
    )

    is_active = models.BooleanField(
        "Доступен",
        default=True
    )

    created_at = models.DateTimeField(
        "Дата создания",
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Автомобиль"
        verbose_name_plural = "Автомобили"
        ordering = ["id"]

    def __str__(self):
        return self.name


class Booking(models.Model):

    car = models.ForeignKey(
        Car,
        verbose_name="Автомобиль",
        on_delete=models.CASCADE,
        related_name="bookings",
    )

    date_from = models.DateField(
        "Дата начала брони"
    )

    date_to = models.DateField(
        "Дата окончания брони"
    )

    client_name = models.CharField(
        "Имя клиента",
        max_length=150,
        blank=True
    )

    client_phone = models.CharField(
        "Телефон клиента",
        max_length=30,
        blank=True
    )

    created_at = models.DateTimeField(
        "Создано",
        auto_now_add=True
    )

    class Meta:
        verbose_name = "Бронь"
        verbose_name_plural = "Брони"
        ordering = ["car", "date_from"]

    def __str__(self):
        return f"{self.car.name}: {self.date_from:%d.%m.%Y} — {self.date_to:%d.%m.%Y}"

    def clean(self):
        if self.date_to < self.date_from:
            raise ValidationError(
                "Дата окончания брони не может быть раньше даты начала."
            )