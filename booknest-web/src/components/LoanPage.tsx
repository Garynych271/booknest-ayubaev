import { useState } from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
export function LoanPage() {
  const [submitted, setSubmitted] = useState(false);
  return <main className="main main--loan">
    <nav className="breadcrumbs" aria-label="Хлебные крошки"><ol><li><a href="?">Каталог</a></li><li><span aria-current="page">Форма выдачи</span></li></ol></nav>
    <h1>Оформление выдачи книги</h1>
    <section className="loan-summary"><h2>Выбранная книга</h2><article><h3>Solaris</h3><Badge tone="available">Учебный экземпляр ЛР1–4</Badge><p>Станислав Лем, 1961</p><p>Форма не отправляет данные на сервер.</p></article></section>
    <section className="loan-form"><h2>Данные выдачи</h2>
      <form onSubmit={event => { event.preventDefault(); setSubmitted(true); }} onReset={() => setSubmitted(false)}>
        <fieldset><legend>Читатель</legend>
          <p><label htmlFor="reader-name">Имя и фамилия</label><input id="reader-name" name="readerName" required minLength={2} maxLength={80} pattern="[A-Za-zА-Яа-яЁёІіӘәҒғҚқҢңӨөҰұҮүҺһ .\-]+" /></p>
          <p><label htmlFor="reader-email">Электронная почта</label><input type="email" id="reader-email" name="readerEmail" required autoComplete="email" /></p>
        </fieldset>
        <fieldset><legend>Параметры</legend>
          <p><label htmlFor="loan-date">Дата выдачи</label><input type="date" id="loan-date" name="loanDate" required min="2026-01-01" /></p>
          <p><label htmlFor="loan-days">Срок выдачи, дней</label><input type="number" id="loan-days" name="loanDays" required min={1} max={30} defaultValue={14} /></p>
          <p><label htmlFor="loan-comment">Комментарий библиотекаря</label><textarea id="loan-comment" name="loanComment" maxLength={400} rows={5} /></p>
        </fieldset>
        <fieldset><legend>Подтверждение</legend><p><input type="checkbox" id="rules-accepted" name="rulesAccepted" required /><label htmlFor="rules-accepted">Читатель согласен вернуть книгу в указанный срок</label></p></fieldset>
        <Button type="submit">Оформить выдачу</Button><Button type="reset" tone="quiet">Очистить форму</Button>
        {submitted && <p role="status">Данные формы прошли нативную проверку. Серверная отправка появится в следующей лабораторной.</p>}
      </form>
    </section>
    <aside className="loan-rules"><h2>Памятка библиотекаря</h2><p>Перед выдачей проверьте экземпляр и отсутствие просроченных книг.</p></aside>
  </main>;
}
