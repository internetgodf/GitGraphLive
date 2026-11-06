# Chrome Web Store — тексты листинга (GitGraph Live v0.3)

## Название (EN)
GitGraph Live — live commit graph for GitHub

## Краткое описание (≤132 символов, EN)
Live commit graph + stale branch radar for any GitHub repo. See branches, merges and abandoned work at a glance.

## Краткое описание (RU)
Живой граф коммитов и надзор за брошенными ветками любого репозитория GitHub.

## Подробное описание (EN)
```
GitGraph Live adds two things GitHub is missing:

🗂 GRAPH TAB
• Colorful commit graph for the last 40 commits of any repository
• Each branch gets its own colored line; merges curve into the trunk
• The trunk is always on the left, exactly like git log --graph
• Hover a dot for "author · message" tooltip
• Animated "living" reveal

🪦 BRANCHES TAB
• Your repo's branch cemetery: every branch ranked by last activity
• ✅ alive · ⏳ no commits for 14+ days · 🪦 abandoned for 30+ days
• ↑/↓ badges: how far each branch is behind (or ahead of) main
• Summary line: total branches, how many are stale, biggest gap
• Click any branch to open it on GitHub
• Dates for up to 100 branches with your own token (free plan: first 25)

❤ PRIVACY & EFFICIENCY
• Reads only public GitHub API, no analytics, no tracking
• Optional personal token: 5,000 API calls/hour instead of 60
• 10-minute cache: repeated opens cost 0 API calls
• Works in Chrome, Edge, Brave and other Chromium browsers

Perfect for reviewers, team leads and anyone browsing large open-source projects.
```

## Подробное описание (RU)
```
GitGraph Live добавляет на GitHub две вещи, которых там не хватает:

🗂 ВКЛАДКА «ГРАФ»
• Живой граф последних 40 коммитов любого репозитория
• У каждой ветки своя цветная линия; merge красиво вплетается в ствол
• Ствол всегда слева, как в git log --graph
• Наведение на точку — подсказка «автор · сообщение»
• Анимация «оживления» графа

🪦 ВКЛАДКА «ВЕТКИ»
• Кладбище веток репозитория: все ветки по дате последней активности
• ✅ живая · ⏳ без коммитов 14+ дней · 🪦 брошена 30+ дней
• Значки ↑/↓: насколько ветка отстала от main (или обогнала её)
• Сводка: сколько веток всего, сколько брошенных и где самый большой разрыв
• Клик по ветке — открыть её на GitHub
• Даты для 100 веток с личным токеном (бесплатный план — первые 25)

❤ ПРИВАТНОСТЬ И ЭКОНОМИЯ
• Только публичный GitHub API, никакой аналитики и трекинга
• Опциональный личный токен: 5000 запросов/час вместо 60
• Кэш 10 минут: повторные открытия не тратят лимит
• Работает в Chrome, Edge, Brave и других Chromium-браузерах

Для ревьюеров, тимлидов и всех, кто ходит по большим open-source проектам.
```

## Категория
Developer Tools

## Языки листинга
English (default) + Russian

## Единое назначение (Single Purpose, для формы публикации)
"Displays a commit graph and a branch-staleness list on GitHub repository pages."

## Обоснование разрешений (Permissions justification)
- **Content script on github.com**: "The extension injects a floating panel UI onto GitHub repository pages to display the graph and branch list."
- **Host permissions**: none beyond content script match.
- **storage / localStorage**: none (tab/session storage only, for the token the user chooses to save and the 10-min data cache).
- Service worker (background.js) is only used to open the panel when the user clicks the toolbar icon.

## Политика приватности (для формы)
"GitGraph Live does not collect, store or transmit any user data to third parties. It reads public data from the GitHub API on the user's behalf. The optional GitHub token is stored locally in the browser (localStorage) and sent only to api.github.com."

## Скриншоты (1280×800,PNG, до 5 штук)
Рекомендация что снять:
1. Граф на живом крупном репозитории (например torvalds/linux) — панель раскрыта
2. Вкладка «Ветки 🪦» на репо с кучей веток (например microsoft/vscode)
3. Демо-режим (панель на главной GitHub) — если реальные скрины стеснительные
4. Можно 2–3 шт., не обязательно 5

## Промо-плитка (маленькая, 440×280)
Необязательна для личного аккаунта-разработчика. Можно пропустить.
