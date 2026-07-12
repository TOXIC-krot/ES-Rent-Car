/* ============ CAR ICON (side-view silhouette, reused, tinted via currentColor) ============ */
function carSVG(fill) {
    return `<svg viewBox="0 0 200 90" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 60 C10 44 22 40 34 38 L52 22 C58 16 68 12 80 12 L128 12 C140 12 150 16 158 24 L172 38 C184 40 194 46 194 60 L194 66 C194 70 190 72 186 72 L14 72 C10 72 6 70 6 66 Z"
      fill="${fill}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>
    <path d="M62 22 L74 38 L138 38 L150 22 C142 17 132 14 122 14 L92 14 C82 14 70 17 62 22 Z" fill="rgba(11,11,13,.72)"/>
    <line x1="100" y1="22" x2="100" y2="38" stroke="rgba(0,0,0,.4)" stroke-width="1.5"/>
    <circle cx="46" cy="72" r="15" fill="#0b0b0d"/><circle cx="46" cy="72" r="6.5" fill="#5a5a5e"/>
    <circle cx="154" cy="72" r="15" fill="#0b0b0d"/><circle cx="154" cy="72" r="6.5" fill="#5a5a5e"/>
    <rect x="8" y="52" width="10" height="4" rx="2" fill="#ffd54a"/>
    <rect x="182" y="52" width="10" height="4" rx="2" fill="#d71920"/>
  </svg>`;
}

/* ============ specs icon set ============ */
const ic = {
    seats: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6M4 12h16v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/></svg>`,
    trans: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>`,
    fuel: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22V8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M3 22h10M16 8l3 3v6a1.5 1.5 0 0 0 3 0v-5l-3-4"/></svg>`,
};

/* ============ DATA ============ */
const CLASS_COLORS = {
    'Эконом': '#8a8a8f',
    'Комфорт': '#c9c9cc',
    'Бизнес': '#d71920',
    'Внедорожник': '#3a3a3d',
    'Премиум': '#0b0b0d'
};

let bookedCache = {};

/* Считает занятые дни конкретного месяца по реальным броням авто,
   пришедшим из Django-админки (car.bookings = [{from:"2026-07-15", to:"2026-07-18"}, ...]) */
function bookedDaysFor(car, year, month) {
    const key = car.id + '-' + year + '-' + month;
    if (bookedCache[key]) return bookedCache[key];

    const set = new Set();
    (car.bookings || []).forEach(b => {
        const from = new Date(b.from + 'T00:00:00');
        const to = new Date(b.to + 'T00:00:00');
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const day = new Date(year, month, d);
            if (day >= from && day <= to) set.add(d);
        }
    });

    bookedCache[key] = set;
    return set;
}

/* ============ RENDER CATALOG ============ */
const carousel = document.getElementById('carousel');
const filtersEl = document.getElementById('filters');
let activeClass = 'Все';

function renderFilters() {
    const classes = ['Все', ...new Set(cars.map(c => c.cls))];
    filtersEl.innerHTML = classes.map(c => `<button class="filter-chip ${c===activeClass?'active':''}" data-cls="${c}">${c}</button>`).join('');
    filtersEl.querySelectorAll('.filter-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            activeClass = btn.dataset.cls;
            renderFilters();
            renderCatalog();
        });
    });
}

const dotsEl = document.getElementById('carouselDots');
let dragMoved = false;

function renderCatalog() {
    const list = activeClass === 'Все' ? cars : cars.filter(c => c.cls === activeClass);
    carousel.innerHTML = list.map(c => `
    <div class="car-card" data-id="${c.id}">
      <div class="car-media">
        <img src="${c.image}" class="car-image" alt="${c.name}">
        <div class="plate mono">${c.plate}</div>

        <div class="class-tag">${c.cls}</div>

        </div>
      <div class="car-body">
        <div class="car-name display">${c.name}</div>
        <div class="car-quickspecs">
          <span class="qspec">${ic.seats} ${c.specs['Мест']} мест</span>
          <span class="qspec">${ic.trans} ${c.specs['Коробка']}</span>
          <span class="qspec">${ic.fuel} ${c.specs['Топливо']}</span>
        </div>
        <div class="car-foot">
          <div class="price mono">$${c.price}<span> / сутки</span></div>
          <div class="arrow-btn"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg></div>
        </div>
      </div>
    </div>
  `).join('');
    carousel.scrollTo({
        left: 0
    });
    renderDots(list.length);
    setupDotObserver([...carousel.children]);
}

/* Single delegated click handler — always reads the id from the exact card that was clicked,
   so it always opens the matching car, never a stale or wrong one. */
carousel.addEventListener('click', (e) => {
    if (dragMoved) return; // ignore clicks that were actually a drag
    const card = e.target.closest('.car-card');
    if (!card) return;
    const id = parseInt(card.dataset.id, 10);
    openDetail(id);
});

function renderDots(count) {
    dotsEl.innerHTML = Array.from({
        length: count
    }).map((_, i) =>
        `<button data-i="${i}" aria-label="Слайд ${i+1}" class="${i===0?'active':''}"></button>`
    ).join('');
    dotsEl.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = carousel.children[parseInt(btn.dataset.i)];
            if (card) card.scrollIntoView({
                behavior: 'smooth',
                inline: 'start',
                block: 'nearest'
            });
        });
    });
}

/* Надёжное отслеживание видимой карточки через IntersectionObserver —
   вместо ручного расчёта offsetLeft/scrollLeft, который "плавает" при быстром свайпе.
   На каждое пересечение выбираем карточку с наибольшей видимой долей (ratio). */
let dotObserver = null;
let intersectionRatios = new Map();

function setupDotObserver(cardsArr) {
    if (dotObserver) dotObserver.disconnect();
    intersectionRatios = new Map();
    if (!cardsArr.length) return;

    dotObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            intersectionRatios.set(entry.target, entry.intersectionRatio);
        });

        let bestIdx = 0,
            bestRatio = -1;
        cardsArr.forEach((c, i) => {
            const r = intersectionRatios.get(c) || 0;
            if (r > bestRatio) {
                bestRatio = r;
                bestIdx = i;
            }
        });

        applyActiveDot(bestIdx, cardsArr.length);
    }, {
        root: carousel,
        threshold: [0, 0.25, 0.5, 0.75, 1]
    });

    cardsArr.forEach(c => dotObserver.observe(c));
}

/* Когда несколько карточек одинаково полностью видны сразу (широкий экран),
   IntersectionObserver сам по себе может держать активной не самую последнюю из них.
   Поэтому на краях прокрутки принудительно подсвечиваем первую/последнюю точку —
   так шахматка точек всегда точно соответствует тому, что реально видно. */
function applyActiveDot(bestIdx, count) {
    const atStart = carousel.scrollLeft <= 2;
    const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;

    let finalIdx = bestIdx;
    if (atEnd) finalIdx = count - 1;
    else if (atStart) finalIdx = 0;

    dotsEl.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === finalIdx));
}

carousel.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
        const dots = dotsEl.querySelectorAll('button');
        if (!dots.length) return;
        const atStart = carousel.scrollLeft <= 2;
        const atEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 2;
        if (atEnd) dots.forEach((b, i) => b.classList.toggle('active', i === dots.length - 1));
        else if (atStart) dots.forEach((b, i) => b.classList.toggle('active', i === 0));
    });
});

function scrollCarousel(dir) {
    carousel.scrollBy({
        left: dir * 360,
        behavior: 'smooth'
    });
}

/* header stats */
function renderStats() {
    const target = cars.length;
    const el = document.getElementById('carCount');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        el.textContent = target;
    } else {
        let n = 0;
        const step = () => {
            n += 1;
            el.textContent = n;
            if (n < target) requestAnimationFrame(() => setTimeout(step, 55));
        };
        step();
    }
    document.getElementById('sideFree').textContent = cars.length;
    document.getElementById('sideClasses').textContent = new Set(cars.map(c => c.cls)).size;
    document.getElementById('sideMinPrice').textContent = '$' + Math.min(...cars.map(c => c.price));
}

/* ============ DETAIL PAGE ============ */
let currentCar = null;
let viewYear, viewMonth;
let selStart = null,
    selEnd = null;

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function openDetail(id) {
    currentCar = cars.find(c => c.id === id);
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    selStart = null;
    selEnd = null;

    document.getElementById("detailMedia").innerHTML = `<img src="${currentCar.image}" class="detail-image" alt="${currentCar.name}">`;
    document.getElementById('detailName').textContent = currentCar.name;
    document.getElementById('detailClass').textContent = 'Класс: ' + currentCar.cls;
    document.getElementById('detailPrice').innerHTML = '$' + currentCar.price + ' <span>/ сутки</span>';
    document.getElementById('detailPlate').textContent = currentCar.plate;

    document.getElementById('specGrid').innerHTML = Object.entries(currentCar.specs).map(([k, v]) => `
    <div class="spec-item"><div class="k">${k}</div><div class="v">${v}</div></div>
  `).join('');

    renderCalendar();
    updateBookingPanel();

    document.getElementById('page-catalog').classList.remove('active');
    document.getElementById('page-detail').classList.add('active');
    window.scrollTo({
        top: 0,
        behavior: 'instant' in window ? 'instant' : 'auto'
    });
    history.pushState({
        page: 'detail',
        id
    }, '', '#car-' + id);
}

function goToCatalog() {
    document.getElementById('page-detail').classList.remove('active');
    document.getElementById('page-catalog').classList.add('active');
    history.pushState({
        page: 'catalog'
    }, '', '#catalog');
    window.scrollTo({
        top: 0
    });
}

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page === 'detail') {
        openDetail(e.state.id);
    } else {
        goToCatalog();
    }
});

function shiftMonth(dir) {
    viewMonth += dir;
    if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
    }
    if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
    }
    selStart = null;
    selEnd = null;
    renderCalendar();
    updateBookingPanel();
}

function renderCalendar() {
    document.getElementById('calTitle').textContent = MONTHS[viewMonth] + ' ' + viewYear;
    const grid = document.getElementById('calGrid');
    const firstDay = new Date(viewYear, viewMonth, 1);
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const booked = bookedDaysFor(currentCar, viewYear, viewMonth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < startOffset; i++) html += `<div class="cal-cell empty"></div>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const thisDate = new Date(viewYear, viewMonth, d);
        thisDate.setHours(0, 0, 0, 0);
        const isPast = thisDate < today;
        const isBooked = booked.has(d);
        const isToday = thisDate.getTime() === today.getTime();
        let cls = 'cal-cell';
        if (isPast) cls += ' past';
        else if (isBooked) cls += ' booked';
        else cls += ' avail';
        if (isToday) cls += ' today';

        if (selStart && !selEnd && d === selStart) cls += ' selected';
        if (selStart && selEnd && d >= selStart && d <= selEnd) cls += ' in-range';

        html += `<div class="${cls}" data-day="${d}" ${(!isPast && !isBooked)?'onclick="pickDay('+d+')"':''}>${d}</div>`;
    }
    grid.innerHTML = html;
}

function pickDay(d) {
    const booked = bookedDaysFor(currentCar, viewYear, viewMonth);
    if (!selStart || (selStart && selEnd)) {
        selStart = d;
        selEnd = null;
    } else {
        if (d < selStart) {
            selStart = d;
        } else {
            // check no booked days in between
            let blocked = false;
            for (let x = selStart; x <= d; x++) {
                if (booked.has(x)) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) {
                selStart = d;
                selEnd = null;
            } else {
                selEnd = d;
            }
        }
    }
    renderCalendar();
    updateBookingPanel();
}

function updateBookingPanel() {
    const startEl = document.getElementById('bpStart');
    const endEl = document.getElementById('bpEnd');
    const daysEl = document.getElementById('bpDays');
    const totalEl = document.getElementById('bpTotal');

    if (selStart) {
        startEl.textContent = selStart + ' ' + MONTHS[viewMonth].toLowerCase() + ' ' + viewYear;
    } else {
        startEl.textContent = 'не выбрано';
    }

    if (selEnd) {
        endEl.textContent = selEnd + ' ' + MONTHS[viewMonth].toLowerCase() + ' ' + viewYear;
    } else {
        endEl.textContent = 'не выбрано';
    }

    const days = (selStart && selEnd) ? (selEnd - selStart + 1) : (selStart ? 1 : 0);
    daysEl.textContent = days;
    totalEl.textContent = '$' + (days * currentCar.price);
}

/* ============ MODAL / BOOKING ============ */
let bookingMode = 'reserve';

function openBookingModal(mode) {
    bookingMode = mode;
    document.getElementById('modalForm').style.display = 'block';
    document.getElementById('modalSuccess').classList.remove('active');
    document.getElementById('modalTitle').textContent = mode === 'rent' ? 'Аренда сейчас' : 'Бронирование';
    document.getElementById('modalSub').textContent = mode === 'rent' ?
        'Оставьте контакты — авто закрепим за вами немедленно.' :
        'Оставьте контакты — мы удержим авто на выбранные даты.';
    document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

function submitBooking() {
    const name = document.getElementById('fName').value.trim();
    const phone = document.getElementById('fPhone').value.trim();
    if (!name || !phone) {
        document.getElementById('fName').style.borderColor = name ? 'rgba(255,255,255,.2)' : 'var(--red)';
        document.getElementById('fPhone').style.borderColor = phone ? 'rgba(255,255,255,.2)' : 'var(--red)';
        return;
    }
    // Визуально блокирует даты сразу после отправки заявки (до перезагрузки страницы).
    // Это не сохраняет бронь на сервере — реальную занятость нужно занести в Django-админку
    // (Car → Брони этого автомобиля), тогда она попадёт в cars_json при следующей загрузке.
    if (selStart) {
        const end = selEnd || selStart;
        const booked = bookedDaysFor(currentCar, viewYear, viewMonth);
        for (let d = selStart; d <= end; d++) booked.add(d);
    }
    document.getElementById('modalForm').style.display = 'none';
    document.getElementById('modalSuccess').classList.add('active');
    document.getElementById('successTitle').textContent = bookingMode === 'rent' ? 'Авто арендовано!' : 'Бронь подтверждена!';
    document.getElementById('successText').textContent = selStart ?
        `${currentCar.name} закреплён за вами на ${(selEnd? (selEnd-selStart+1):1)} дн. Мы свяжемся по номеру ${phone}.` :
        `Заявка на ${currentCar.name} принята. Мы свяжемся по номеру ${phone}, чтобы согласовать даты.`;
    renderCalendar();
    updateBookingPanel();
}

/* ============ MENU (all breakpoints) ============ */
function toggleMenu() {
    const isOpen = document.getElementById('navLinks').classList.toggle('open');
    document.getElementById('burger').classList.toggle('open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
}

function closeMenu() {
    document.getElementById('navLinks').classList.remove('open');
    document.getElementById('burger').classList.remove('open');
    document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

/* ============ INIT ============ */
renderStats();
renderFilters();
renderCatalog();