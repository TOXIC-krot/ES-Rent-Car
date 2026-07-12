import json

from django.shortcuts import render

from .models import Car


def home(request):

    cars = []

    for car in Car.objects.filter(is_active=True):

        bookings = [
            {
                "from": booking.date_from.isoformat(),
                "to": booking.date_to.isoformat(),
            }
            for booking in car.bookings.all()
        ]

        cars.append({

            "id": car.id,

            "name": car.name,

            "cls": car.car_class,

            "plate": car.plate,

            "price": car.price,

            "image": car.image.url if car.image else "",

            "bookings": bookings,

            "specs": {

                "Двигатель": car.engine,

                "Коробка": car.gearbox,

                "Мест": car.seats,

                "Топливо": car.fuel,

                "Расход": car.consumption,

                "Год": car.year,

            }

        })

    return render(request, "index.html", {
        "cars_json": json.dumps(cars, ensure_ascii=False)
    })
