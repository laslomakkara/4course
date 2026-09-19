# Интеграция с БД и агрегация данных

API использует встроенную SQLite-базу Node.js. При первом запуске создаются таблицы `partners` и `sales_history`, а затем добавляются демонстрационные данные.

Запуск тестов:

```powershell
npm test
```

Запуск API:

```powershell
npm start
```

Доступные запросы:

- `GET http://localhost:3000/api/partners` — все партнёры с суммарным объёмом и скидкой.
- `GET http://localhost:3000/api/partners/1` — один партнёр по идентификатору.

Партнёр без записей в `sales_history` возвращается с `total_quantity: 0` и `discount_percent: 0`.
