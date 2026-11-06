# Как опубликовать GitGraph Live в Chrome Web Store

## Шаг 0. Что уже готово
- [x] Иконки 16/32/48/128 (icons/)
- [x] Локализация имени и описания (_locales/en, _locales/ru)
- [x] Интерфейс панели: EN/RU (авто по языку браузера)
- [x] Клик по иконке на тулбаре открывает панель (background.js)
- [x] Тексты листинга (STORE_LISTING.md)
- [x] Пакет: gitgraph-live-v0.3.0.zip (manifest в корне архива)

## Шаг 1. Аккаунт разработчика ($5 разово)
1. Заходи https://chrome.google.com/webstore/devconsole (или developer.chrome.com → Dashboard)
2. Войди своим Google-аккаунтом
3. Оплати единоразовый взнос $5 (карта; в РФ может понадобиться зарубежная карта или обходной путь — это самый нудный шаг)

## Шаг 2. Загрузка пакета
1. Dashboard → **New item**
2. Перетащи `gitgraph-live-v0.3.0.zip`
3. Дождись проверки (наши права минимальные, должна пройти быстро)

## Шаг 3. Листинг
1. Вкладка **Store listing**
2. Вставь тексты из STORE_LISTING.md (description, RU-вариант через Опишем «Add language → Russian»)
3. Загрузи 2–3 скриншота 1280×800 (подробности в конце STORE_LISTING.md)
4. Категория **Developer Tools**, язык основной English

## Шаг 4. Приватность
1. Вкладка **Privacy** → Practices:
   - "Single purpose" — текст из STORE_LISTING.md
   - Question "Do you collect user data?" → **No**
2. Distribution: выбор стран (можно «везде»), видимостью: Public

## Шаг 5. Отправка
1. **Submit for review**
2. Обычный срок проверки для простых расширений: от пары часов до пары дней
3. После одобрения получишь ссылку вида chrome.google.com/webstore/detail/gitgraph-live/<ID>
4. Putи ID регистра — добавь в README

## Обновления в будущем
- Поднимаешь `version` в manifest.json (например 0.3.1)
- Пересобираешь ZIP (см. команду внизу README)
- Dashboard → твоё приложение → Package → Upload new package
- New version проходит проверку быстрее первой

## Как пересобрать ZIP после правок
```powershell
$src = "<путь к папке GitGraphLive>"
$stage = "$env:TEMP\ggl_stage"
Remove-Item $stage -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $stage\GitGraphLive | Out-Null
Copy-Item "$src\manifest.json","$src\background.js","$src\content.js","$src\styles.css" "$stage\GitGraphLive"
Copy-Item "$src\icons","$src\_locales" "$stage\GitGraphLive" -Recurse
Compress-Archive -Path "$stage\GitGraphLive\*" -DestinationPath "$src\gitgraph-live-v<ВЕРСИЯ>.zip" -Force
```
Важно: манифест должен лежать в корне ZIP, без вложенной папки — поэтому копируем в staging и архивируем `*`.
