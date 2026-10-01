/* ============================================================
   Демо-приложение на чистом JavaScript + Ajax (XMLHttpRequest)
   API: https://jsonplaceholder.typicode.com/
   ------------------------------------------------------------
   Разделы: Посты | Пользователи | Задачи
   Ajax-запросы: GET, POST, PUT, PATCH, DELETE
   ============================================================ */
'use strict';

const API = 'https://jsonplaceholder.typicode.com';

/* ---------- Кэш данных ---------- */
const state = {
  posts: [],
  users: [],
  todos: [],
  search: '',
  todoFilter: 'all',          // all | done | active
  usersLoaded: false,
  todosLoaded: false,
};

/* ---------- Ссылки на DOM ---------- */
const els = {
  tabs: document.querySelectorAll('.tabs__btn'),
  panels: {
    posts: document.getElementById('panel-posts'),
    users: document.getElementById('panel-users'),
    todos: document.getElementById('panel-todos'),
  },
  postsGrid: document.getElementById('posts-grid'),
  usersGrid: document.getElementById('users-grid'),
  todosList: document.getElementById('todos-list'),
  searchInput: document.getElementById('search-input'),
  addBtn: document.getElementById('add-btn'),
  statusBar: document.getElementById('status-bar'),
  modal: document.getElementById('modal'),
  modalTitle: document.getElementById('modal-title'),
  modalBody: document.getElementById('modal-body'),
};

/* ============================================================
   AJAX-слой: обёртка над XMLHttpRequest (классический Ajax)
   ============================================================ */

/**
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {string} url   — путь, например /posts
 * @param {Object|null} [body]
 * @returns {Promise<any>} — распарсенный JSON
 */
function request(method, url, body = null) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, API + url, true);

    if (body) xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Некорректный JSON в ответе'));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Сеть недоступна (ошибка соединения)'));
    xhr.ontimeout = () => reject(new Error('Превышено время ожидания'));
    xhr.timeout = 15000;

    xhr.send(body ? JSON.stringify(body) : null);
  });
}

const api = {
  getPosts:   ()        => request('GET', '/posts?_limit=18'),
  getUsers:   ()        => request('GET', '/users'),
  getTodos:   ()        => request('GET', '/todos?_limit=20'),
  getPost:    (id)      => request('GET', `/posts/${id}`),
  getComments:(postId)  => request('GET', `/posts/${postId}/comments`),
  getUser:    (id)      => request('GET', `/users/${id}`),
  createPost: (data)    => request('POST', '/posts', data),
  updatePost: (id, data) => request('PUT', `/posts/${id}`, data),
  patchTodo:  (id, data) => request('PATCH', `/todos/${id}`, data),
  deletePost: (id)      => request('DELETE', `/posts/${id}`),
};

/* ============================================================
   Утилиты интерфейса
   ============================================================ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setStatus(text, isError = false) {
  els.statusBar.textContent = text;
  els.statusBar.classList.toggle('status--error', isError);
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/\n/g, '&#10;');
}

function openModal(title, bodyHtml) {
  els.modalTitle.textContent = title;
  els.modalBody.innerHTML = bodyHtml;
  els.modal.hidden = false;
}

function closeModal() {
  els.modal.hidden = true;
  els.modalBody.innerHTML = '';
}

/** Показать спиннер внутри контейнера */
function showSpinner(container) {
  container.innerHTML =
    '<div class="state"><div class="spinner"></div>Загрузка данных...</div>';
}

/** Показать сообщение об ошибке внутри контейнера */
function showError(container, message) {
  container.innerHTML =
    `<div class="state state--error">⚠ ${escapeHtml(message)}<br><br>
     <button class="btn" onclick="loadPosts(true)">Повторить</button></div>`;
}

/* ============================================================
   Рендеринг: ПОСТЫ
   ============================================================ */

function renderPosts() {
  const q = state.search.trim().toLowerCase();
  const list = state.posts.filter(
    (p) => !q || p.title.toLowerCase().includes(q) || p.body.toLowerCase().includes(q)
  );

  if (!list.length) {
    els.postsGrid.innerHTML = '<div class="state">Ничего не найдено по вашему запросу.</div>';
    return;
  }

  els.postsGrid.innerHTML = list
    .map((post) => {
      const user = state.users.find((u) => u.id === post.userId);
      return `
      <article class="card" data-id="${post.id}">
        <h3 class="card__title">${escapeHtml(post.title)}</h3>
        <p class="card__text">${escapeHtml(post.body)}</p>
        <span class="card__meta">Автор: <b>${user ? escapeHtml(user.name) : `ID ${post.userId}`}</b></span>
        <div class="card__actions">
          <button class="btn btn--sm" data-action="comments">💬 Комментарии</button>
          <button class="btn btn--sm" data-action="edit">✏️ Изменить</button>
          <button class="btn btn--sm btn--danger" data-action="delete">🗑 Удалить</button>
        </div>
      </article>`;
    })
    .join('');
}

async function loadPosts(force = false) {
  if (state.posts.length && !force) { renderPosts(); return; }
  showSpinner(els.postsGrid);
  setStatus('Загрузка постов…');
  try {
    const [posts, users] = await Promise.all([api.getPosts(), api.getUsers()]);
    state.posts = posts;
    state.users = users;
    state.usersLoaded = true;
    renderPosts();
    setStatus(`Постов: ${posts.length}`);
  } catch (err) {
    showError(els.postsGrid, err.message);
    setStatus('Ошибка', true);
  }
}

/* ============================================================
   Рендеринг: ПОЛЬЗОВАТЕЛИ
   ============================================================ */

function renderUsers() {
  if (!state.users.length) {
    els.usersGrid.innerHTML = '<div class="state">Нет данных.</div>';
    return;
  }

  const q = state.search.trim().toLowerCase();
  const list = state.users.filter(
    (u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  );

  if (!list.length) {
    els.usersGrid.innerHTML = '<div class="state">Ничего не найдено.</div>';
    return;
  }

  els.usersGrid.innerHTML = list
    .map((u) => `
      <article class="card">
        <h3 class="card__title">${escapeHtml(u.name)}</h3>
        <span class="card__meta">@${escapeHtml(u.username)} — ${escapeHtml(u.email)}</span>
        <span class="card__meta">🏢 ${escapeHtml(u.company.name)}</span>
        <span class="card__meta">📍 ${escapeHtml(u.address.city)}, ${escapeHtml(u.address.street)}</span>
        <span class="card__meta">📞 ${escapeHtml(u.phone)}</span>
        <a class="card__link" href="http://${escapeHtml(u.website)}" target="_blank" rel="noopener">
          🌐 ${escapeHtml(u.website)}
        </a>
        <button class="btn btn--sm" data-user="${u.id}" style="margin-top:8px">✉️ Написать пост</button>
      </article>`)
    .join('');
}

async function loadUsers() {
  if (state.usersLoaded) { renderUsers(); return; }
  showSpinner(els.usersGrid);
  setStatus('Загрузка пользователей…');
  try {
    state.users = await api.getUsers();
    state.usersLoaded = true;
    renderUsers();
    setStatus(`Пользователей: ${state.users.length}`);
  } catch (err) {
    showError(els.usersGrid, err.message);
    setStatus('Ошибка', true);
  }
}

/* ============================================================
   Рендеринг: ЗАДАЧИ (todos)
   ============================================================ */

function renderTodos() {
  const q = state.search.trim().toLowerCase();
  let list = state.todos.filter(
    (t) => !q || t.title.toLowerCase().includes(q)
  );
  if (state.todoFilter === 'done')   list = list.filter((t) => t.completed);
  if (state.todoFilter === 'active') list = list.filter((t) => !t.completed);

  if (!list.length) {
    els.todosList.innerHTML = '<li class="state">Нет задач по выбранному фильтру.</li>';
    return;
  }

  els.todosList.innerHTML = list
    .map((t) => {
      const user = state.users.find((u) => u.id === t.userId);
      return `
      <li class="todo ${t.completed ? 'todo--done' : ''}">
        <input type="checkbox" class="todo__check" data-id="${t.id}" ${t.completed ? 'checked' : ''}>
        <span class="todo__text">${escapeHtml(t.title)}</span>
        <span class="todo__user">${user ? escapeHtml(user.username) : `#${t.userId}`}</span>
      </li>`;
    })
    .join('');
}

async function loadTodos() {
  if (state.todosLoaded) { renderTodos(); return; }
  showSpinner(els.todosList);
  setStatus('Загрузка задач…');
  try {
    const todos = await api.getTodos();
    state.todos = todos;
    state.todosLoaded = true;
    if (!state.usersLoaded) state.users = await api.getUsers();
    state.usersLoaded = true;
    renderTodos();
    setStatus(`Задач: ${todos.length}`);
  } catch (err) {
    showError(els.todosList, err.message);
    setStatus('Ошибка', true);
  }
}

/* ============================================================
   Действия: CRUD постов (POST / PUT / DELETE)
   ============================================================ */

function openPostForm(post = null, presetUserId = null) {
  const isEdit = Boolean(post);
  openModal(
    isEdit ? 'Редактировать пост' : 'Новый пост',
    `
    <form id="post-form" class="form">
      <label>Заголовок
        <input name="title" required maxlength="120" value="${post ? escapeAttr(post.title) : ''}">
      </label>
      <label>Текст поста
        <textarea name="body" rows="5" required>${post ? escapeHtml(post.body) : ''}</textarea>
      </label>
      <label>Автор (userId)
        <input name="userId" type="number" min="1" max="10" required
               value="${post ? post.userId : (presetUserId || 1)}">
      </label>
      <div class="form__actions">
        <button type="button" class="btn" data-close-modal>Отмена</button>
        <button type="submit" class="btn btn--primary">${isEdit ? 'Сохранить' : 'Создать'}</button>
      </div>
    </form>`
  );

  document.getElementById('post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      title: fd.get('title'),
      body: fd.get('body'),
      userId: Number(fd.get('userId')),
    };
    try {
      setStatus(isEdit ? 'Сохранение…' : 'Создание…');
      const saved = isEdit
        ? await api.updatePost(post.id, payload)
        : await api.createPost(payload);

      if (isEdit) {
        const idx = state.posts.findIndex((p) => p.id === post.id);
        if (idx !== -1) state.posts[idx] = { ...state.posts[idx], ...saved };
      } else {
        state.posts.unshift(saved); // API возвращает id: 101 — не забудем про кэш
      }
      closeModal();
      renderPosts();
      setStatus(isEdit ? 'Пост обновлён' : `Пост создан (id: ${saved.id})`);
    } catch (err) {
      setStatus(err.message, true);
      alert('Не удалось сохранить пост: ' + err.message);
    }
  });
}

async function openPostDetails(postId) {
  openModal('Пост #' + postId, '<div class="state"><div class="spinner"></div>Загрузка комментариев…</div>');
  try {
    // Два параллельных Ajax-запроса: сам пост + его комментарии
    const [post, comments] = await Promise.all([api.getPost(postId), api.getComments(postId)]);
    openModal(
      escapeHtml(post.title),
      `
      <p>${escapeHtml(post.body).replace(/\n/g, '<br>')}</p>
      <p class="card__meta">Автор: <b>${escapeHtml((state.users.find((u) => u.id === post.userId) || {}).name || '—')}</b></p>
      <hr style="margin:14px 0;border:none;border-top:1px dashed var(--border)">
      <p class="card__meta"><b>Комментарии (${comments.length}):</b></p>
      ${comments.map((c) => `
        <p style="margin:10px 0">
          <b>${escapeHtml(c.name)}</b> <span class="card__meta">(${escapeHtml(c.email)})</span><br>
          ${escapeHtml(c.body).replace(/\n/g, '<br>')}
        </p>`).join('')}
      `
    );
  } catch (err) {
    openModal('Ошибка', `<p class="state--error">⚠ ${escapeHtml(err.message)}</p>`);
  }
}

async function deletePost(id) {
  if (!confirm(`Удалить пост #${id}?`)) return;
  setStatus('Удаление…');
  try {
    await api.deletePost(id); // API вернёт 200 {}
    state.posts = state.posts.filter((p) => p.id !== id);
    renderPosts();
    setStatus(`Пост #${id} удалён (DELETE)`);
  } catch (err) {
    setStatus(err.message, true);
    alert('Ошибка удаления: ' + err.message);
  }
}

/* ============================================================
   Действия: задачи (PATCH)
   ============================================================ */

async function toggleTodo(checkbox) {
  const id = Number(checkbox.dataset.id);
  const todo = state.todos.find((t) => t.id === id);
  if (!todo) return;

  const newCompleted = checkbox.checked;
  checkbox.disabled = true;
  try {
    await api.patchTodo(id, { completed: newCompleted }); // JSONPlaceholder вернёт обновлённый объект
    todo.completed = newCompleted;
    renderTodos();
    setStatus(`Задача #${id} ${newCompleted ? 'выполнена' : 'возобновлена'} (PATCH)`);
  } catch (err) {
    checkbox.checked = !newCompleted; // откат
    setStatus(err.message, true);
  } finally {
    checkbox.disabled = false;
  }
}

/* ============================================================
   Обработчики событий (делегирование)
   ============================================================ */

els.tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    els.tabs.forEach((b) => {
      b.classList.toggle('tabs__btn--active', b === btn);
      b.setAttribute('aria-selected', b === btn);
    });
    Object.entries(els.panels).forEach(([key, panel]) => {
      panel.hidden = key !== btn.dataset.tab;
    });

    if (btn.dataset.tab === 'posts') loadPosts();
    if (btn.dataset.tab === 'users') loadUsers();
    if (btn.dataset.tab === 'todos') loadTodos();
  });
});

els.searchInput.addEventListener('input', () => {
  state.search = els.searchInput.value;
  renderPosts();
  renderUsers();
  renderTodos();
});

els.addBtn.addEventListener('click', () => openPostForm());

/* Делегирование кликов по карточкам постов */
els.postsGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.closest('.card').dataset.id);
  const post = state.posts.find((p) => p.id === id);

  switch (btn.dataset.action) {
    case 'comments': openPostDetails(id); break;
    case 'edit': openPostForm(post); break;
    case 'delete': deletePost(id); break;
  }
});

/* Делегирование кликов по карточкам пользователей */
els.usersGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-user]');
  if (!btn) return;
  openPostForm(null, Number(btn.dataset.user));
});

/* Делегирование кликов по списку задач */
els.todosList.addEventListener('change', (e) => {
  if (e.target.classList.contains('todo__check')) toggleTodo(e.target);
});

/* Фильтры задач */
document.querySelector('.todos-filter').addEventListener('click', (e) => {
  const filterBtn = e.target.closest('[data-filter]');
  if (filterBtn) {
    state.todoFilter = filterBtn.dataset.filter;
    document.querySelectorAll('.btn--filter').forEach((b) =>
      b.classList.toggle('btn--filter-active', b === filterBtn)
    );
    renderTodos();
    return;
  }
  if (e.target.id === 'todos-toggle') {
    const allDone = state.todos.every((t) => t.completed);
    state.todos.forEach((t) => { t.completed = !allDone; });
    renderTodos();
    setStatus(allDone ? 'Все задачи возобновлены' : 'Все задачи завершены (локально)');
  }
});

/* Закрытие модального окна */
els.modal.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-close-modal')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ============================================================
   Инициализация: загружаем посты при старте
   ============================================================ */
loadPosts();
