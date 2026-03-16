# Теория по стеку проекта — подготовка к собеседованию

> Документ охватывает **TypeScript, JavaScript (ES6+), ООП, SCSS/CSS, Vite, IMask, Vitest, localStorage, BEM, Git, GitHub Actions**.
> После каждой темы — каверзные вопросы с ответами.

---

## 1. TypeScript

### Что такое TypeScript
TypeScript (TS) — надмножество JavaScript с опциональной статической типизацией. TS компилируется в JS — браузер никогда не видит `.ts`-файлы.

Компилятор (`tsc`) проверяет типы **только во время сборки**, в рантайме типов нет.

### Ключевые конструкции языка

#### `interface` vs `type`
```typescript
// Interface — расширяемый, только для объектов/классов
interface Contact {
    id: string;
    name: string;
}
interface ContactWithEmail extends Contact {
    email: string;
}

// Type alias — гибче: примитивы, union, intersection
type ToastType = "success" | "error" | "info";
type ID = string | number;
type ContactOrNull = Contact | null;
```
**Разница:**
- `interface` можно расширить позже через declaration merging — `type` нельзя
- `type` умеет union/intersection — `interface` нет
- В большинстве случаев взаимозаменяемы, разница лишь в edge cases

#### `generics`
Параметрический полиморфизм — функция/класс работает с любым типом, сохраняя типобезопасность:
```typescript
// Из проекта:
public read<T>(key: string, fallbackValue: T): T {
    const rawValue = localStorage.getItem(key);
    try {
        return JSON.parse(rawValue) as T;
    } catch {
        return fallbackValue;
    }
}
// Использование:
this.storage.read<Contact[]>("contacts", []);
this.storage.read<Group[]>("groups", []);
```
`T` — параметр типа, TS выводит его из переданного аргумента или явного указания.

#### `readonly`
```typescript
// Поле нельзя переприсвоить после инициализации в конструкторе
private readonly storage: StorageService;
```
Используется для зависимостей — защищает от случайной замены объекта.

#### `union types`
```typescript
type ToastType = "success" | "error" | "info";
// TS не позволит передать "warning" — ошибка на этапе компиляции
```

#### `non-null assertion (!)`
```typescript
document.querySelector<HTMLElement>("[data-toast-container]")!
// ! — говорит TS "я уверен, что это не null"
// Если на самом деле null — runtime error
// Используется когда мы точно знаем что элемент есть в DOM
```

#### `as` (type assertion)
```typescript
return JSON.parse(rawValue) as T;
// Принудительное приведение типа
// НЕ кастует данные в runtime — только говорит TS чем считать значение
```

#### `import type`
```typescript
import type { Contact, Group } from "./types";
// Импортируется только как тип, в JS не попадает
// Оптимизация бандла
```

#### Опциональные поля и `?` оператор
```typescript
interface DraftGroup extends Group {
    isNew?: boolean; // необязательное поле
}
const isNew = group.isNew ?? false; // nullish coalescing
contact?.groupId  // optional chaining — не упадёт если contact = undefined
```

---

### Каверзные вопросы по TypeScript

**Q: В чём разница между `unknown` и `any`?**
A: `any` — отключает проверку типов полностью. `unknown` — заставляет сначала проверить тип перед использованием. `unknown` безопаснее.
```typescript
let x: any = "hello";
x.toFixed(); // TS не ругается, но в runtime — ошибка

let y: unknown = "hello";
y.toFixed(); // TS ошибка сразу — нужно проверить тип
if (typeof y === "string") y.toUpperCase(); // ок
```

**Q: Что происходит с типами в runtime?**
A: Ничего. TypeScript полностью стирается при компиляции в JS. В браузере типов нет, все аннотации исчезают. Это значит, что `as T` в `StorageService.read` не гарантирует что данные из localStorage реально соответствуют типу — это ответственность разработчика.

**Q: Что такое `strict` режим?**
A: Набор строгих проверок в `tsconfig.json`. Включает: `noImplicitAny` (нельзя использовать переменные без типа), `strictNullChecks` (null/undefined — отдельные типы), и другие. В проекте использован `strict: true`.

**Q: Разница `extends` в интерфейсах и в generics?**
A:
- В интерфейсах — наследование структуры: `interface B extends A`
- В generics — ограничение типа: `<T extends Group>` означает "T должен быть совместим с Group"

**Q: Почему `JSON.parse` возвращает `any`, а не конкретный тип?**
A: Потому что JSON — строка, TS не знает что в ней. `JSON.parse` возвращает `any`. Мы делаем `as T` — это assertion без гарантии. Для надёжности нужен runtime-валидатор (zod, io-ts).

---

## 2. JavaScript (ES6+)

### Классы
```typescript
class ContactManager {
    private contacts: Contact[] = [];

    constructor(storage: StorageService) {
        this.storage = storage;
    }
}
```
Класс в JS — синтаксический сахар над прототипным наследованием. `class` не создаёт отдельный тип как в Java/C# — под капотом это функция-конструктор.

#### `this` в классах
`this` зависит от контекста вызова. В стрелочных функциях `this` берётся из лексического окружения:
```javascript
// Проблема:
button.addEventListener("click", function() {
    this.close(); // this — кнопка, не класс!
});
// Решение — стрелочная функция:
button.addEventListener("click", () => {
    this.close(); // this — класс, всё правильно
});
```

### Деструктуризация и spread
```typescript
// Spread — создаёт shallow copy:
return [...this.contacts]; // новый массив, те же объекты внутри

// Деструктуризация:
const { id, name } = group;
```

### Map и Set
```typescript
// Map — ключ-значение с любым типом ключа:
const previousById = new Map(
    this.groupsBeforeEdit.map((group) => [group.id, group])
);
previousById.get(group.id); // O(1) поиск

// Set — уникальные значения:
const allowedGroupIds = new Set(groups.map(g => g.id));
allowedGroupIds.has(id); // O(1) проверка
```

### Методы массивов (используются в проекте)
```typescript
.filter()   // новый массив из подходящих элементов
.map()      // новый массив из трансформированных элементов
.find()     // первый подходящий элемент или undefined
.some()     // true если хоть один элемент подходит
.every()    // true если все элементы подходят
.unshift()  // добавить в начало массива (новые контакты сверху)
.join("")   // объединить строки
```

### Промисы и Event Loop
Event Loop — механизм выполнения асинхронного кода:
1. Call Stack — синхронный код
2. Task Queue — setTimeout, setInterval
3. Microtask Queue — Promise.then, queueMicrotask

`requestAnimationFrame` использован в `ToastManager`:
```typescript
requestAnimationFrame(() => {
    toastElement.classList.add("toast--visible");
});
// Почему: даём браузеру сначала вставить элемент в DOM,
// потом добавляем класс с transition — анимация сработает
```

### `crypto.randomUUID()`
```typescript
export const createId = (): string => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID(); // Web Crypto API — уникальный UUID v4
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`; // fallback
};
```
`crypto.randomUUID()` — браузерный стандарт, генерирует RFC 4122 UUID v4.

---

### Каверзные вопросы по JS

**Q: В чём разница `==` и `===`?**
A: `==` — приведение типов перед сравнением (`"0" == 0` → true). `===` — строгое сравнение без приведения (`"0" === 0` → false). Всегда использовать `===`.

**Q: Что такое замыкание?**
A: Функция, которая "помнит" переменные из внешней области видимости даже после её завершения:
```javascript
function createCounter() {
    let count = 0;
    return () => ++count; // замыкание над count
}
const counter = createCounter();
counter(); // 1
counter(); // 2
```
В проекте — каждый обработчик события замыкается над `this` класса.

**Q: Разница `let`, `const`, `var`?**
A:
- `var` — функциональная область видимости, hoisting, нет блочной области
- `let` — блочная область видимости, нет hoisting
- `const` — блочная область, нельзя переприсвоить (но объект мутировать можно)

**Q: Что такое hoisting?**
A: Подъём объявлений переменных и функций в начало области видимости. `var`-переменные поднимаются с значением `undefined`. `function` поднимается полностью. `let`/`const` поднимаются, но не инициализируются — Temporal Dead Zone.

**Q: Глубокое vs поверхностное копирование?**
A:
```javascript
const arr = [{ id: 1 }];
const shallow = [...arr]; // новый массив, но те же объекты
shallow[0].id = 99; // меняет оригинал!

const deep = JSON.parse(JSON.stringify(arr)); // глубокое, но теряет функции/Date
const deep2 = structuredClone(arr); // современный стандарт
```
В проекте `getContacts()` возвращает `[...this.contacts]` — поверхностная копия массива достаточна, т.к. внешний код не должен мутировать объекты.

**Q: Почему `unshift` для новых контактов вместо `push`?**
A: `unshift` добавляет в начало массива — новые контакты отображаются первыми в списке. UX-решение.

---

## 3. ООП

### Четыре принципа

#### Инкапсуляция
Скрытие деталей реализации, доступ только через публичный интерфейс:
```typescript
class ContactManager {
    private contacts: Contact[] = []; // скрыто
    public getContacts(): Contact[] { // доступно
        return [...this.contacts]; // возвращаем копию, не оригинал!
    }
}
```
Возврат копии — важно: внешний код не может напрямую мутировать внутренний массив.

#### Наследование
В проекте минимально (только `DraftGroup extends Group`). Предпочтена **композиция** — `ContactsApp` содержит экземпляры компонентов, а не наследует от них.

#### Полиморфизм
Разные реализации одного интерфейса. В проекте косвенно — `StorageService` используется через единый API (`read/write`), при тестировании подменяется `MemoryStorage`.

#### Абстракция
`ContactManager` скрывает детали работы с хранилищем — вызывающий код не знает про localStorage.

### Композиция vs Наследование
```typescript
// Наследование — жёсткая связь
class ContactsApp extends ToastManager { ... }

// Композиция — гибкая связь (используется в проекте)
class ContactsApp {
    private readonly toast = new ToastManager(...);
    // легко заменить на другой ToastManager
}
```
**Правило:** "предпочитай композицию наследованию" (Gang of Four).

### SOLID

**S — Single Responsibility Principle**
Класс должен иметь одну причину для изменения:
- `StorageService` — только работа с хранилищем ✅
- `ContactManager` — только бизнес-логика ✅
- `ContactsApp` — нарушает: и UI, и рендер, и обработчики событий ❌

**O — Open/Closed Principle**
Открыт для расширения, закрыт для изменения. Добавление нового типа тоста не требует изменения `ToastManager` — достаточно нового CSS-класса.

**L — Liskov Substitution Principle**
Подтип должен быть заменяемым на базовый тип. В тестах `MemoryStorage` заменяет реальный `StorageService` — система работает одинаково.

**I — Interface Segregation Principle**
Маленькие специализированные интерфейсы лучше одного большого. `ContactPayload` отделён от `Contact` — разные задачи.

**D — Dependency Inversion Principle**
Зависеть от абстракций, не от конкретных реализаций. `ContactManager` принимает `StorageService` через конструктор — это DI (инъекция зависимостей):
```typescript
constructor(storage: StorageService) {
    this.storage = storage;
}
// В тестах:
new ContactManager(new MemoryStorage());
// В проде:
new ContactManager(new StorageService());
```

---

### Каверзные вопросы по ООП

**Q: Чем отличается композиция от наследования?**
A: Наследование — "является" (ContactsApp является ToastManager). Композиция — "содержит" (ContactsApp содержит ToastManager). Наследование создаёт жёсткую связь, которую сложно изменить; композиция гибче и тестируемее.

**Q: Что такое инъекция зависимостей и зачем она в проекте?**
A: DI — передача зависимостей снаружи, а не создание внутри. `ContactManager` не создаёт `StorageService` сам — получает его в конструкторе. Это позволяет в тестах подменить `StorageService` на `MemoryStorage` без изменения логики.

**Q: Почему `getContacts()` возвращает `[...this.contacts]`, а не `this.contacts`?**
A: Защитная копия. Если вернуть прямую ссылку — внешний код сможет мутировать внутренний массив: `app.getContacts().push(fakeContact)`. Это нарушит инкапсуляцию.

**Q: Что такое EventEmitter-паттерн в CustomDropdown?**
A: Паттерн "Наблюдатель" (Observer). `CustomDropdown` хранит подписчиков в `Map<eventName, Set<handler>>`. При событии вызывает всех подписчиков. Внешний код подписывается через `bind()`, не зная деталей дропдауна.

---

## 4. CSS / SCSS / BEM

### БЭМ (Блок-Элемент-Модификатор)
```
.group-card              — блок
.group-card__header      — элемент (двойное подчёркивание)
.group-card--collapsed   — модификатор (двойной дефис)
```
**Зачем:** предотвращает конфликты имён, описывает структуру и состояние.

**Правило:** элемент принадлежит блоку, не другому элементу:
```
// Правильно:
.group-card__contact-name
// Неправильно:
.group-card__list__contact (вложенность через __)
```

### CSS-переменные (Custom Properties)
```css
:root {
    --color-primary: #005bfe;
    --transition-fast: 0.18s ease;
}
.button { background: var(--color-primary); }
```
**Отличие от SCSS-переменных:**
- CSS-переменные работают в runtime, их можно менять через JS
- SCSS-переменные — только во время компиляции
- CSS-переменные наследуются и каскадируются

### Mobile-First
**Принцип:** базовые стили пишем для мобильных, потом расширяем для десктопа через `min-width`:
```scss
// Mobile-first (правильно):
.header { padding: 16px; }
@media (min-width: 768px) {
    .header { padding: 24px; }
}

// Desktop-first (неправильно для этого проекта):
.header { padding: 24px; }
@media (max-width: 767px) {
    .header { padding: 16px; }
}
```
**Почему mobile-first лучше:** браузеры на мобильных не скачивают и не применяют стили для `min-width: 768px`. Приоритет мобильному трафику.

### SCSS — что использовано
```scss
// Вложенность (nesting):
.group-card {
    &__header { ... }  // &  = родительский селектор
    &--collapsed { ... }
}

// Переменные (компилируются в runtime):
$gap: 24px;

// Что НЕ используется в проекте (намеренно):
// @mixin, @include, @extend — не нужны при CSS-переменных
```

### `prefers-reduced-motion`
```scss
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```
Системная настройка ОС — пользователи с вестибулярными расстройствами или эпилепсией могут отключить анимации.

### `transition` vs `animation`
- `transition` — плавный переход между двумя состояниями (hover, active, класс)
- `animation` + `@keyframes` — сложные многошаговые анимации, не требует триггера

В проекте `transition` — для hover/focus/collapse, `@keyframes` — для появления элементов (`item-show`, `overlay-show`).

---

### Каверзные вопросы по CSS/SCSS

**Q: Что такое специфичность CSS?**
A: Приоритет правила. Считается по формуле `(inline, id, class, tag)`:
- inline style: `1,0,0,0`
- `#id`: `0,1,0,0`
- `.class`, `[attr]`, `:pseudo-class`: `0,0,1,0`
- `div`, `span`: `0,0,0,1`

Более высокая специфичность перебивает более низкую независимо от порядка.

**Q: Разница `display: none` vs `visibility: hidden` vs `opacity: 0`?**
A:
- `display: none` — элемент не занимает место в потоке, события не работают
- `visibility: hidden` — место занимает, не виден, события не работают
- `opacity: 0` — место занимает, не виден, **события работают**
- `opacity` + `transition` — используется в проекте для плавного появления тостов

**Q: Что такое `z-index` и почему он иногда не работает?**
A: `z-index` работает только у positioned элементов (`position: relative/absolute/fixed/sticky`). Создаёт stacking context. Если родитель имеет собственный stacking context с низким z-index — дочерний не перекроет соседей родителя.

**Q: В чём разница `rem` и `em`?**
A: `em` — относительно font-size родителя (может накапливаться). `rem` — всегда относительно root (`html`). Для font-size лучше `rem` — предсказуемо.

**Q: Что такое CSS stacking context?**
A: Слой рендеринга. Создаётся при: `position + z-index`, `opacity < 1`, `transform`, `filter`. Дочерние элементы стекируются внутри своего контекста.

---

## 5. Vite

### Что такое Vite
Vite — инструмент сборки нового поколения. В dev-режиме использует native ES-модули браузера — не бандлит, а подаёт файлы напрямую. В prod — использует Rollup.

### Dev vs Build
```
Dev:  файлы → ESBuild (transform) → native ESM → браузер
Prod: файлы → Rollup (bundle) → минификация → dist/
```

ESBuild в ~100 раз быстрее tsc/Webpack благодаря Go.

### Конфиг проекта
```typescript
// vite.config.ts
export default defineConfig({
    base: "/contacts-site/",
});
```
`base` — публичный base URL. Все asset-пути в prod будут начинаться с `/contacts-site/`. **Обязателен** для GitHub Pages, иначе ресурсы ищутся от корня домена, а не от подпапки репозитория.

### HMR (Hot Module Replacement)
При изменении файла — Vite заменяет только этот модуль без полной перезагрузки страницы. Состояние UI сохраняется.

### Tree-shaking
Vite (через Rollup) анализирует `import/export` и удаляет неиспользуемый код. Работает только с ES-модулями (`import/export`), не с CommonJS (`require`).

---

### Каверзные вопросы по Vite

**Q: Чем Vite отличается от Webpack?**
A: Webpack при запуске бандлит всё приложение, Vite в dev-режиме не бандлит — подаёт ESM-файлы напрямую. Vite холодный старт в десятки раз быстрее. Webpack гибче конфигурируется для сложных случаев. Для SPA без легаси Vite — лучший выбор.

**Q: Почему `tsc && vite build`?**
A: `tsc` проверяет типы (но не эмитирует файлы, если `noEmit: true`). Потом `vite build` собирает с трансформацией через ESBuild — он быстрее tsc но **не проверяет типы**. Два шага: тайп-чек + бандл.

**Q: Что такое `type: "module"` в `package.json`?**
A: Указывает что все `.js` файлы в проекте являются ES-модулями (не CommonJS). Позволяет использовать `import/export` без `.mjs` расширения.

---

## 6. localStorage

### API
```javascript
localStorage.setItem("key", JSON.stringify(data)); // запись
localStorage.getItem("key");  // чтение → строка или null
localStorage.removeItem("key");
localStorage.clear();
```
Хранит только строки — поэтому `JSON.stringify/parse`.

### Ограничения
- **~5MB** лимит (зависит от браузера)
- **Синхронный** — блокирует основной поток (не страшно для небольших данных)
- **Same-origin** — доступен только с одного домена/протокола/порта
- **Нет серверного доступа** — только клиент
- **Нет TTL** — данные живут вечно пока явно не удалены

### Отличие от sessionStorage и cookies
- `localStorage` — постоянное, переживает закрытие вкладки
- `sessionStorage` — только в рамках вкладки, очищается при закрытии
- `cookies` — передаются на сервер с каждым запросом, есть TTL, доступны серверу

### Защитный паттерн в `StorageService`
```typescript
try {
    return JSON.parse(rawValue) as T;
} catch {
    return fallbackValue;
}
```
`JSON.parse` может выбросить исключение если строка повреждена. Возвращаем `fallbackValue` — приложение не падает.

---

### Каверзные вопросы по localStorage

**Q: Почему `StorageService` — класс, а не просто функции?**
A: Инкапсуляция деталей работы с хранилищем. В тестах можно подменить на `MemoryStorage` — логика `ContactManager` не изменится. Это DI и тестируемость.

**Q: Что если localStorage недоступен (приватный режим Firefox)?**
A: Может выбросить `SecurityError` или работать с квотой 0. Надёжный код оборачивает весь localStorage в try/catch. В проекте это частично есть в `read()`, но `setItem` не защищён.

**Q: Почему возвращается `fallbackValue` вместо `throw`?**
A: Стратегия "graceful degradation" — если данные повреждены, лучше начать с пустого состояния, чем сломать всё приложение.

---

## 7. IMask

### Что такое IMask
Библиотека для маскирования ввода. Ограничивает формат вводимых данных в реальном времени.

### Использование в проекте
```typescript
this.phoneMask = IMask(this.contactPhoneInputElement, {
    mask: "+{375} (00) 000-00-00",
});
```
- `{375}` — фиксированная часть
- `0` — обязательная цифра

### Lazy-инициализация маски
```typescript
if (!this.phoneMask) {
    this.phoneMask = IMask(this.contactPhoneInputElement, { ... });
}
this.phoneMask.value = this.contactPhoneInputElement.value;
```
Маска создаётся только один раз (при первом открытии формы), потом переиспользуется. Так избегаем множественной подписки.

### Нормализация при проверке уникальности
```typescript
export const normalizePhone = (value: string): string =>
    value.replace(/\D/g, ""); // только цифры
```
Маска добавляет пробелы, скобки, дефисы — при сравнении нужны только цифры.

---

## 8. Vitest и тестирование

### Что такое unit-тест
Тест одной изолированной единицы (функции, метода, класса) без внешних зависимостей.

### Почему Vitest, а не Jest
- Vitest работает нативно с Vite (общий конфиг, трансформация)
- Быстрее Jest благодаря тому же ESBuild
- API совместим с Jest — низкий порог входа

### Структура теста
```typescript
it("запрещает дублирование номера телефона", () => {
    const manager = new ContactManager(new MemoryStorage());
    const group = manager.addGroup("Работа");
    manager.addContact({ name: "Иван", phone: "+375 (29) 111-11-11", groupId: group.id });

    expect(() =>
        manager.addContact({ name: "Петр", phone: "+375 (29) 111-11-11", groupId: group.id })
    ).toThrowError("Контакт с таким номером телефона уже существует.");
});
```

### `MemoryStorage` — заглушка (stub/fake)
```typescript
class MemoryStorage {
    private store = new Map<string, string>();
    getItem(key) { return this.store.get(key) ?? null; }
    setItem(key, value) { this.store.set(key, value); }
}
```
Подменяет `localStorage` в тестах — нет браузерного окружения.

---

### Каверзные вопросы по тестированию

**Q: Чем stub отличается от mock?**
A: Stub — подставная реализация с реальным поведением (`MemoryStorage`). Mock — объект с ожиданиями по вызовам (`jest.fn()` — можно проверить сколько раз вызван). В проекте используется stub.

**Q: Почему тесты только на `ContactManager`?**
A: Доменная логика — самый ценный код для покрытия. Он не зависит от DOM, легко изолируется. DOM-тесты (через jsdom/Playwright) сложнее и медленнее, для MVP их нет — это нормально.

**Q: Что такое TDD?**
A: Test-Driven Development — сначала пишем тест (красный), потом минимальный код (зелёный), потом рефакторинг. В проекте TDD не применялся, тесты написаны после реализации.

---

## 9. Git и Conventional Commits

### Структура коммита (из ТЗ — "соглашение о коммитах")
```
тип(область): описание

feat(contacts): добавить создание контакта
fix(groups): исправить дублирование названий групп
refactor(app): вынести renderContactRow в отдельный метод
chore(deps): обновить зависимости
docs(readme): добавить инструкцию деплоя
```

**Типы:**
- `feat` — новая функциональность
- `fix` — исправление бага
- `refactor` — рефакторинг без изменения функционала
- `chore` — изменения конфигурации, зависимостей
- `docs` — документация
- `style` — форматирование кода
- `test` — добавление/изменение тестов

### `.gitignore`
Файлы которые не должны попасть в репозиторий:
- `node_modules/` — устанавливается через `npm install`
- `dist/` — генерируется при сборке
- `figma/`, `task/` — рабочие материалы не для продакшена

---

## 10. GitHub Actions и CI/CD

### Что такое CI/CD
- **CI (Continuous Integration)** — автоматические проверки при каждом push (тесты, линтинг, сборка)
- **CD (Continuous Deployment)** — автоматический деплой после успешного CI

### Workflow в проекте
```yaml
on:
    push:
        branches: [master]  # триггер

jobs:
    deploy:
        steps:
            - checkout       # получить код
            - setup node     # установить Node.js
            - npm ci         # установить зависимости точно по lock-файлу
            - npm run build  # собрать проект
            - deploy         # опубликовать dist/ в gh-pages
```

### `npm ci` vs `npm install`
- `npm install` — обновляет `package-lock.json`, может поставить новые версии
- `npm ci` — строго по `package-lock.json`, не меняет его, быстрее, используется в CI

### `peaceiris/actions-gh-pages`
Пушит папку `dist/` в ветку `gh-pages`. GitHub Pages читает именно эту ветку.

---

### Каверзные вопросы по Git/CI

**Q: Чем `git merge` отличается от `git rebase`?**
A: `merge` создаёт merge-commit, сохраняет историю. `rebase` переписывает коммиты поверх другой ветки — линейная история. `rebase` нельзя делать для shared-веток (публичных).

**Q: Что такое `package-lock.json`?**
A: Фиксирует точные версии всех зависимостей (включая транзитивные). Гарантирует воспроизводимость сборки — у всех разработчиков и в CI одни и те же версии.

---

## 11. Kebab-case (из code_style.txt компании)

В компании принят kebab-case для файлов и папок:
- `contact-manager.ts` ✅
- `ContactManager.ts` ❌
- `contactManager.ts` ❌

**Зачем:**
- Нет проблем с case-sensitive файловыми системами (Linux vs macOS/Windows)
- Git может не замечать переименований если только регистр изменился
- Читаемость: `custom-dropdown.ts` vs `CustomDropdown.ts`

В проекте это соблюдено: все файлы в `kebab-case`.

---

## 12. Доступность (Accessibility, a11y)

В проекте применены практики:
- `aria-label` на кнопках без текста (иконки)
- `aria-hidden="true"` на декоративных элементах
- `role="dialog"` и `aria-modal="true"` на модалках
- `aria-label` на `<section>` для скринридеров
- `prefers-reduced-motion` — отключение анимаций
- `focus-visible` — видимый фокус при навигации с клавиатуры

---

## 13. Быстрая шпаргалка "что сказать за 30 секунд"

| Тема | Одна фраза |
|------|-----------|
| TypeScript | Статическая типизация на этапе компиляции, в runtime типов нет |
| Generics | Типобезопасные функции/классы для любого типа без потери информации о нём |
| localStorage | Синхронное key-value хранилище ~5MB, только строки, same-origin |
| BEM | Блок__Элемент--Модификатор, предотвращает конфликты имён |
| Mobile-first | Базовые стили для мобильных, расширяем через min-width |
| Vite | Dev — native ESM без бандлинга, prod — Rollup + tree-shaking |
| SOLID/SRP | Один класс — одна причина для изменения |
| DI | Зависимости передаются снаружи — легко подменяются в тестах |
| EventEmitter | Паттерн Observer: подписчики, emit, bind |
| CI/CD | Автоматическая сборка и деплой при push в master |
