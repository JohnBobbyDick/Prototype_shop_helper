# ShopSee

PWA для людей с нарушениями зрения: камера → категория товара → голосовое сопровождение.

**Стек:** Next.js 16 · FastAPI · SQLite · YOLOv8

## Для участников команды (clone → run)

Нужно: **Node.js 20+**, **Python 3.10+**, **Git**.

```powershell
git clone <url-репозитория>
cd shopsee
```

**Терминал 1 — бэкенд:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Дождитесь в консоли: `Detection model READY`.

**Терминал 2 — фронтенд:**

```powershell
cd frontend
npm install
npm run dev
```

Откройте http://localhost:3000

**Проверка:** http://127.0.0.1:8000/api/health → `"status":"ok"`, `"detector_ready":true`

Файлы `.env` **не нужны** — всё работает из коробки.

### macOS / Linux

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
cd frontend && npm install && npm run dev
```

## Что в репозитории, а что локально

| В Git (общее для всех) | Только на вашем ПК |
|------------------------|-------------------|
| Код `frontend/` и `backend/` | `node_modules/`, `frontend/.next/` |
| `backend/yolov8n.pt` (модель) | `backend/.venv/` |
| `.cursor/` (для Cursor) | **`backend/shopsee.db`** — история и настройки |

**База `shopsee.db` у каждого своя.** После `git clone` она создаётся при первом запуске бэкенда. История сканов и настройки (язык, голос) не синхронизируются через Git — это нормально.

## Обновление проекта

```powershell
git pull
```

Затем при необходимости:

```powershell
# если менялся backend/requirements.txt
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# если менялся frontend/package.json
cd frontend
npm install
```

Перезапустите оба сервера.

## Структура

```
shopsee/
├── frontend/       # Next.js PWA
├── backend/        # FastAPI + YOLO
│   └── yolov8n.pt
├── .cursor/        # skills для Cursor (опционально)
└── README.md
```

## Если что-то не работает

| Симптом | Решение |
|---------|---------|
| `detector_ready: false` | `pip install -r requirements.txt`, интернет для скачивания модели |
| Ошибки API / CORS | Бэкенд с `--host 0.0.0.0`, порты 8000 и 3000 не заблокированы |
| Сломалась БД | Удалить `backend/shopsee.db`, перезапустить бэкенд |

## Для мейнтейнера

Пушите в `main` — команда делает `git pull`, переустанавливает зависимости при изменении `requirements.txt` / `package-lock.json`, перезапускает серверы. Личные данные (`shopsee.db`, кэши) в коммиты не попадают.
