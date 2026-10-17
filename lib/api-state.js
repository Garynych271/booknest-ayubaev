export function errorMessage(error, online = true) {
  if (error.status === 404) return 'Книга или адрес API не найдены (HTTP 404).';
  if (error.status >= 500) return `Сервис временно недоступен (HTTP ${error.status}). Попробуйте позже.`;
  if (error.status >= 400) return `API отклонил запрос (HTTP ${error.status}). Проверьте запрос и повторите.`;
  if (error.kind === 'timeout') return 'Сервис не ответил за 20 секунд. Повторите запрос.';
  if (error.kind === 'data') return 'API вернул некорректные данные. Повторите запрос позже.';
  return online ? 'Не удалось связаться с Open Library. Проверьте соединение и повторите.' : 'Нет подключения к сети. Подключитесь и повторите запрос.';
}

// A revision guards state even if an obsolete transport ignores cancellation.
export function createLoader(state, render, online = () => true) {
  let revision = 0;
  let controller;
  function cancel() {
    revision += 1;
    controller?.abort();
    state.loading = false;
  }
  async function run(task, accept) {
    cancel();
    const current = revision;
    const active = new AbortController();
    controller = active;
    state.status = 'loading';
    state.loading = true;
    state.error = '';
    render();
    try {
      const value = await task(active.signal);
      if (current === revision) accept(value);
    } catch (error) {
      if (current === revision && error.name !== 'AbortError') {
        active.abort();
        state.status = 'error';
        state.error = errorMessage(error, online());
      }
    } finally {
      if (current === revision) {
        state.loading = false;
        if (state.status === 'loading') state.status = 'empty';
        render();
      }
    }
  }
  return { run, cancel };
}
