import { ContactsApp } from "./app";
import "./styles/main.scss";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="app">
    <header class="header">
      <div class="header__container">
        <div class="header__title-wrap">
          <span class="header__logo" aria-hidden="true"></span>
          <h1 class="header__title">Книга контактов</h1>
        </div>
        <div class="header__actions">
          <button class="button button--accent button--header button--header-add" type="button" data-open-contact-modal>
            <span>Добавить контакт</span>
            <span aria-hidden="true">＋</span>
          </button>
          <button class="button button--primary" type="button" data-open-groups-modal>
            Группы
          </button>
        </div>
      </div>
    </header>

    <main class="page">
      <button class="button button--accent button--mobile-add" type="button" data-open-contact-modal>
        <span>Добавить контакт</span>
        <span aria-hidden="true">＋</span>
      </button>

      <section class="contacts" aria-label="Список контактов">
        <p class="contacts__empty" data-empty-state>Список контактов пуст</p>
        <ul class="contacts__list" data-contacts-list></ul>
      </section>
    </main>

    <div class="modal-overlay modal-overlay--drawer" data-contact-modal>
      <section class="drawer" role="dialog" aria-modal="true" aria-label="Форма контакта">
        <div class="drawer__head">
          <h2 class="drawer__title" data-contact-title>Добавление контакта</h2>
          <button class="drawer__close" type="button" data-modal-close aria-label="Закрыть">×</button>
        </div>
        <form class="form form--drawer" data-contact-form novalidate>
          <div class="form__field">
            <input class="form__input" type="text" name="name" placeholder="Введите ФИО" />
            <p class="form__error" data-error-name></p>
          </div>

          <div class="form__field">
            <input class="form__input" type="text" name="phone" placeholder="Введите номер" />
            <p class="form__error" data-error-phone></p>
          </div>

          <div class="form__field">
            <div class="dropdown" data-dropdown>
              <button class="dropdown__trigger" data-dropdown-trigger type="button">
                <span data-dropdown-value>Выберите группу</span>
                <span class="dropdown__icon" aria-hidden="true"></span>
              </button>
              <ul class="dropdown__list" data-dropdown-list></ul>
            </div>
            <p class="form__error" data-error-group></p>
          </div>

          <button class="button button--primary form__submit" type="submit">Сохранить</button>
        </form>
      </section>
    </div>

    <div class="modal-overlay modal-overlay--drawer" data-groups-modal>
      <section class="drawer drawer--groups" role="dialog" aria-modal="true" aria-label="Управление группами">
        <div class="drawer__head">
          <h2 class="drawer__title drawer__title--groups" data-groups-title>Группы контактов</h2>
          <button class="drawer__close" type="button" data-modal-close aria-label="Закрыть">×</button>
        </div>

        <section class="groups-drawer" aria-label="Список групп">
          <ul class="groups-drawer__list" data-groups-list></ul>

          <div class="groups-drawer__footer">
            <button class="button button--ghost" type="button" data-group-add-toggle>Добавить</button>
            <button class="button button--primary" type="button" data-group-save>Сохранить</button>
          </div>
        </section>
      </section>
    </div>

    <div class="modal-overlay" data-confirm-modal>
      <section class="modal confirm" role="dialog" aria-modal="true" aria-label="Подтверждение удаления">
        <h3 class="confirm__title">Удалить группу?</h3>
        <p class="confirm__text" data-confirm-message></p>
        <div class="confirm__actions">
          <button class="button button--primary" type="button" data-confirm-submit>Да, удалить</button>
          <button class="button" type="button" data-confirm-cancel>Отмена</button>
        </div>
      </section>
    </div>

    <div class="toast-container" data-toast-container></div>
  </div>
`;

new ContactsApp().init();
