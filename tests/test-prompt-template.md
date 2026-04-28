# Universal MCP Test Prompt Template — vanilla-video-feed

## Назначение

Этот файл — **шаблон промпта** для AI-агента, который тестирует функциональность проекта **vanilla-video-feed** через Chrome DevTools MCP.

**Как использовать:** скопировать секцию «Промпт для агента» в чат, заменив `{НАЗВАНИЕ_ФУНКЦИОНАЛА}` на конкретную фичу для проверки.

---

## Промпт для агента

---

Проверь функциональность **{НАЗВАНИЕ_ФУНКЦИОНАЛА}** в проекте vanilla-video-feed.

### Контекст проекта

- **Описание:** Вертикальный фид коротких видео (аналог TikTok/Reels). Vanilla JS, без фреймворков.
- **Стэк:** HTML5 / CSS3 / Vanilla JS (ES modules) / Node.js сервер.
- **Сервер:** `http://localhost:3000` (запускать через `npm start` в корне проекта).
- **API:** `GET /api/videos` — возвращает JSON со списком видео.
- **API-ключ:** Должен быть в `credentials.json` или в переменной окружения `GOOGLE_API_KEY`.
- **Виртуализация:** VirtualFeed рендерит только active ± 2 (буфер). Остальное — спейсеры.
- **Отложенная загрузка видео:** `<video>` создаётся с `data-src`, `src` выставляется только при входе в буфер.
- **Единое активное видео:** IntersectionObserver (threshold: 0.25, 0.6, 0.9) определяет самое видимое. Только оно играет.
- **preload:** active → `'auto'`, neighbour → `'metadata'`, far → `'none'`.
- **Прокси видео:** сервер проксирует файлы через `GET /api/proxy/video/:fileId` (Google Drive download URL).
- **`safePlay()`:** все вызовы `video.play()` обёрнуты в `safePlay()`, который глотает (`catch` rejected promise от autoplay-policy).
- **FeedObserver пересоздаётся** при каждой смене активного индекса (после обновления VirtualFeed).
- **Tab visibility:** `document.addEventListener('visibilitychange', ...)` — при скрытии вкладки активное видео ставится на паузу.

### Состояния кнопок управления

Активное видео запускается сразу (через `safePlay`). Состояния кнопок определяются `getControlViews()`:

| Кнопка | Состояние | `textContent` | `aria-label` |
|---|---|---|---|
| `.js-play-toggle` | Видео играет | `❚❚` | `Pause video` |
| `.js-play-toggle` | Видео на паузе | `▶` | `Play video` |
| `.js-mute-toggle` | Видео в muted | `🔇` | `Unmute video` |
| `.js-mute-toggle` | Видео не muted | `🔊` | `Mute video` |

> **Важно:** все `.feed-video` создаются с атрибутом `muted`. При первой отрисовке кнопка mute показывает `🔇` / `Unmute video`.

### DOM-структура (ключевые селекторы)

| Селектор | Описание |
|---|---|
| `.feed` | Контейнер фида |
| `.feed-item[data-index="N"]` | Карточка видео N |
| `.feed-video` | Видеоэлемент |
| `.js-play-toggle` | Кнопка play/pause |
| `.js-mute-toggle` | Кнопка mute/unmute |
| `.js-progress` | Полоса прогресса (`<span>`, ширина в `style.width` в %) |
| `.video-loading` | Индикатор загрузки (показывается по умолчанию, скрывается при `loadeddata`) |
| `.video-error` | Сообщение об ошибке (создаётся **динамически** при ошибке видео) |
| `.video-overlay` | Нижний оверлей с controls и метаданными |
| `.video-title` | Заголовок видео (`<h2>`) |
| `.video-subtitle` | Автор видео (`<p>`) |
| `.video-progress` | Родительский контейнер прогресс-бара |
| `.video-progress-value` | Сам элемент прогресс-бара (совпадает с `.js-progress`) |
| `.control-btn` | Общий класс для кнопок управления |
| `.feed-spacer` | Спейсер виртуализации (верхний/нижний) |
| `.feed-content` | Контейнер с отрендеренными `.feed-item` |
| `.empty-state` | Состояние «нет видео» |
| `.hidden` | `display: none !important` (утилитарный класс) |
| `#app`, `#feed`, `#emptyState` | Корневые элементы |

### Доступные MCP-инструменты

- **Навигация:** `navigate_page` (url/back/forward/reload), `wait_for`, `new_page`, `close_page`, `select_page`, `list_pages`
- **Работа с DOM:** `take_snapshot`, `click` (одинарный/двойной), `fill`, `fill_form`, `hover`, `drag`, `press_key`, `type_text`, `upload_file`
- **JavaScript:** `evaluate_script` (синхронные и асинхронные функции, с аргументами-uid)
- **Сеть:** `list_network_requests` (с фильтрацией по `resourceTypes` и пагинацией), `get_network_request`
- **Консоль:** `list_console_messages` (с фильтрацией по типам), `get_console_message`
- **Производительность:** `performance_start_trace`, `performance_stop_trace`, `performance_analyze_insight`, `lighthouse_audit`, `take_memory_snapshot`
- **Эмуляция:** `emulate` (networkConditions, CPU, geolocation, userAgent, colorScheme, viewport)
- **Скриншоты:** `take_screenshot` (страница или элемент, fullPage, JPEG/PNG/WebP)
- **Диалоги:** `handle_dialog`

### Preconditions

1. Убедись, что сервер запущен (если нет — запусти `npm start` в корне проекта).
2. Проверь, что `credentials.json` содержит валидный Google API key.
3. Открой браузер (Chrome/Chromium) на `http://localhost:3000`.
4. Дождись полной загрузки фида: появятся `.feed-content` с дочерними `.feed-item[data-index="..."]` внутри.
5. Убедись, что в консоли нет ошибок JavaScript и сетевых ошибок (кроме возможных 502 при проксировании видео).

### Инструкции по тестированию

1. **Спланируй сценарии** для проверки `{НАЗВАНИЕ_ФУНКЦИОНАЛА}`. Разбей на атомарные проверки.
2. **Выполни каждый сценарий**, используя MCP-инструменты из списка выше.
3. **Фиксируй результаты:**
   - Для каждой проверки укажи шаги (с MCP-вызовами), ожидание и фактический результат.
   - При необходимости делай скриншоты (`take_screenshot`).
   - Для сетевых/консольных проверок используй `list_network_requests` / `list_console_messages`. Обрати внимание на запросы к `/api/videos` (список) и `/api/proxy/video/:fileId` (прокси видео).
   - Для JS-логики используй `evaluate_script`.
   - Для проверки кнопок управления проверяй `textContent` и `aria-label` соответствующих элементов.
4. **Обрабатывай граничные случаи:** пустой фид, ошибки сети, быстрая навигация (PageUp/PageDown), ресайз окна, скрытие/показ вкладки (visibilitychange).

### Формат отчёта

Верни отчёт в Markdown:

````markdown
# Отчёт: {НАЗВАНИЕ_ФУНКЦИОНАЛА}

## Pre-conditions
- Сервер: ✅ / ❌
- API key: ✅ / ❌
- Фид загружен: ✅ / ❌

## Сценарии

### 1. Короткое название проверки

**Шаги:**
(описание шагов с MCP-вызовами)

**Ожидание:**
(что должно произойти)

**Результат:** ✅ / ❌ / ⚠️ (частично)
(если ❌ или ⚠️ — описание проблемы, скриншот, лог)

### 2. ...

## Итоговая таблица

| # | Проверка | Статус |
|---|---|---|
| 1 | ... | ✅ / ❌ / ⚠️ |
| 2 | ... | ✅ / ❌ / ⚠️ |

## Замечания
(любые баги, несоответствия, предложения)
````

### Ограничения

- **НЕ редактируй** файлы проекта (код, конфиги, стили).
- **НЕ удаляй** и не перемещай файлы.
- **НЕ меняй** credentials.json.
- Если сервер не запускается или API ключ невалиден — **прекрати тестирование** и сообщи об этом.
- Если какая-то проверка не может быть выполнена через MCP — укажи причину.
- **Важно:** в проекте есть две функции рендеринга — `VirtualFeed._createItemElement()` (используется в продакшене, создаёт `<video data-src=...>`) и `renderFeed()` в `feedRenderer.js` (используется **только в unit-тестах**, создаёт `<video src=...>`). При тестировании через браузер работа идёт через VirtualFeed.

---

*Конец промпта.*
