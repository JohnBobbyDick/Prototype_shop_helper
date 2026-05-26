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

Дождитесь: `Detection model READY`.

**Терминал 2 — фронтенд:**

```powershell
cd frontend
npm install
npm run dev
```

Откройте http://localhost:3000

**Проверка:** http://127.0.0.1:8000/api/health → `"detector_ready": true`

`.env` не нужен.

### macOS / Linux

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

```bash
cd frontend && npm install && npm run dev
```

## Что общее для всех, а что локальное

### Одинаково у всех (лежит в Git, в коде)

Стартовые настройки доступности задаются **один раз в репозитории**:

| Параметр | Значение по умолчанию |
|----------|------------------------|
| Язык | `ru` |
| Голос | включён |
| Скорость голоса | `1.0` |
| Шрифт | `large` (крупный) |
| Высокий контраст | включён |

Файл: `backend/app/core/defaults.py` (зеркало: `frontend/src/lib/defaults.ts`).

После `git clone` и первого запуска бэкенда каждый получает **те же** стартовые настройки.

Код, модель YOLO (`backend/yolov8n.pt`), `.cursor/` — тоже общие.

### Локально на каждом ПК (не в Git)

Файл `backend/shopsee.db` создаётся сам при первом запуске:

| Таблица | Зачем | В Git? |
|---------|--------|--------|
| **История сканов** | Тестовые/личные сканы на этой машине | Нет |
| **Настройки** | Копия дефолтов из кода; меняется, если пользователь крутил ползунки в приложении | Нет |

Историю сканов **не** синхронизируем — у каждого разработчика свои тестовые данные.

Настройки **по умолчанию одинаковые**; в Git не кладём базу, потому что там ещё история и возможные локальные правки в UI.

Сброс к заводским настройкам: удалить `backend/shopsee.db` и перезапустить бэкенд.

## Обновление проекта

```powershell
git pull
```

При изменении зависимостей:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

cd ..\frontend
npm install
```

Перезапустите оба сервера.

Если в `defaults.py` поменяли дефолты и нужно увидеть их у себя — удалите `backend/shopsee.db` и перезапустите бэкенд.

## Структура

```
shopsee/
├── frontend/
├── backend/
│   ├── app/core/defaults.py   # стартовые настройки для всех
│   └── yolov8n.pt
├── .cursor/
└── README.md
```

## Если что-то не работает

| Симптом | Решение |
|---------|---------|
| `detector_ready: false` | `pip install -r requirements.txt` |
| Ошибки API | Бэкенд с `--host 0.0.0.0` |
| Пустые настройки / ошибка БД | Удалить `backend/shopsee.db`, перезапустить бэкенд |

## Для мейнтейнера

Пушите код в `main`. Команда: `git pull` → при необходимости `pip` / `npm install` → перезапуск.

Меняете дефолты голоса/шрифта — правьте `backend/app/core/defaults.py` и `frontend/src/lib/defaults.ts` (значения должны совпадать).

В коммиты не попадают: `shopsee.db`, `node_modules/`, `.next/`, `.venv/`.
