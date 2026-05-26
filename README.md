# ShopSee

PWA для людей с нарушениями зрения: камера → категория товара → голосовое сопровождение.

**Стек:** Next.js 16 · FastAPI · SQLite · YOLOv8

---

## Быстрый запуск

**Нужно:** Node.js 20+, Python 3.10+.

### 1. Бэкенд (FastAPI + YOLO)

В PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Первый раз (если ещё нет `.venv`):

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Дождитесь в консоли: `Detection model READY`.

**Проверка:** http://127.0.0.1:8000/api/health → `"status":"ok"`, `"detector_ready":true`

> Модель `yolov8n.pt` уже в репозитории. Если файла нет — скачается при первом запуске (нужен интернет).

### 2. Фронтенд (Next.js)

В **другом** окне терминала:

```powershell
cd frontend
npm install
npm run dev
```

Откройте http://localhost:3000

---

**Первый clone проекта:**

```powershell
git clone <url-репозитория>
cd shopsee
```

Затем шаги 1 и 2 выше. Файл `.env` не нужен.

### macOS / Linux

```bash
# бэкенд
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# фронтенд (другой терминал)
cd frontend && npm install && npm run dev
```

---

## Обновление (`git pull`)

```powershell
git pull

cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd ..\frontend
npm install
```

Перезапустите оба сервера.

---

## Данные и настройки

| В Git (одинаково у всех) | Только на вашем ПК |
|--------------------------|-------------------|
| Код, `yolov8n.pt` | `backend/shopsee.db` |
| Дефолты: RU, голос вкл, шрифт large, контраст — `backend/app/core/defaults.py` | История сканов, правки в UI |

База создаётся сама при первом запуске бэкенда. В Git не коммитится.

Сброс настроек и истории: удалить `backend/shopsee.db` → перезапустить бэкенд.

---

## Если не работает

| Проблема | Решение |
|----------|---------|
| `detector_ready: false` | `pip install -r requirements.txt`, проверить интернет |
| Ошибки API / CORS | Бэкенд с `--host 0.0.0.0` |
| Сломалась БД | Удалить `backend/shopsee.db`, перезапустить бэкенд |

---

## Для мейнтейнера

Пуш в `main` → команда делает `git pull` и перезапуск.

Меняете дефолты голоса/шрифта — правьте `backend/app/core/defaults.py` и `frontend/src/lib/defaults.ts` (значения должны совпадать).
