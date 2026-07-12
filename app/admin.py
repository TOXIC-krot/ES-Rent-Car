from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .models import Car, Booking


class BookingInline(admin.TabularInline):
    """
    Брони прямо на странице авто:
    - забронировать — добавить строку и указать date_from/date_to;
    - снять бронь — поставить галочку "Delete?" у строки и сохранить.
    """
    model = Booking
    extra = 1
    fields = ("date_from", "date_to", "client_name", "client_phone")
    verbose_name = "Бронь"
    verbose_name_plural = "Брони этого автомобиля"


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):

    list_display = (
        "row_number",
        "photo",
        "name",
        "car_class",
        "price",
        "is_active",
        "delete_link",
    )

    list_display_links = ("name",)

    list_filter = (
        "car_class",
        "is_active",
    )

    search_fields = (
        "name",
        "plate",
    )

    list_per_page = 50

    inlines = [BookingInline]

    class Media:
        css = {
            "all": ("admin/rentline_rows.css",)
        }

    def row_number(self, obj):
        """
        Сквозной счётчик 1, 2, 3... по порядку id — не зависит от того,
        что часть авто могла быть удалена (номера не будут иметь дыр).
        """
        return Car.objects.filter(id__lte=obj.id).count()
    row_number.short_description = "№"

    def photo(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="height:44px;width:66px;object-fit:cover;'
                'border-radius:4px;border:1px solid #ddd;" />',
                obj.image.url,
            )
        return "—"
    photo.short_description = "Фото"

    def delete_link(self, obj):
        """Быстрое удаление авто одной кнопкой прямо из списка, без открытия карточки."""
        url = reverse(
            f"admin:{obj._meta.app_label}_{obj._meta.model_name}_delete",
            args=[obj.pk],
        )
        return format_html(
            '<a href="{}" style="'
            'display:inline-block;padding:6px 14px;'
            'background:#d71920;color:#fff;font-weight:700;font-size:12px;'
            'border-radius:4px;text-decoration:none;text-align:center;'
            '">Удалить</a>',
            url,
        )
    delete_link.short_description = "Удаление"


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    """
    Отдельный раздел со всеми бронями по всем авто сразу —
    видно занятость целиком, без захода в каждое авто по отдельности.
    """

    list_display = (
        "car",
        "date_from",
        "date_to",
        "client_name",
        "client_phone",
    )

    list_filter = (
        "car",
    )

    date_hierarchy = "date_from"

    search_fields = (
        "car__name",
        "client_name",
        "client_phone",
    )