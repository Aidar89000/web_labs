/* ==========================================================
   Лабораторная работа №2
   Простое приложение: HTML + CSS + JavaScript (Ajax)
   API: https://jsonplaceholder.typicode.com/
   ========================================================== */

const API = "https://jsonplaceholder.typicode.com";

// Элементы страницы
const form = document.getElementById("form");
const titleInput = document.getElementById("title");
const bodyInput = document.getElementById("body");
const statusLine = document.getElementById("status");
const list = document.getElementById("list");

/* ----------------------------------------------------------
   Ajax-запрос одной функцией:
   ajax(метод, путь, данные, callback)
   callback получает (ошибка, ответ)
   ---------------------------------------------------------- */
function ajax(method, url, data, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, API + url, true);

  // Для POST сообщаем серверу, что отправляем JSON
  if (data) xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      callback(null, JSON.parse(xhr.responseText));
    } else {
      callback(`Ошибка сервера: ${xhr.status}`, null);
    }
  };

  xhr.onerror = () => callback("Нет соединения с сервером", null);

  xhr.send(data ? JSON.stringify(data) : null);
}

/* ---------- Показать один пост в списке ---------- */
function showPost(post) {
  const li = document.createElement("li");
  li.innerHTML = `
    <h3>${post.title}</h3>
    <p>${post.body}</p>
    <button>Удалить</button>`;

  li.querySelector("button").onclick = () => deletePost(post.id, li);
  list.append(li);
}

/* ---------- GET: загрузить посты ---------- */
function loadPosts() {
  statusLine.textContent = "Загрузка...";

  ajax("GET", "/posts?_limit=10", null, (error, posts) => {
    if (error) {
      statusLine.textContent = error;
      return;
    }

    list.innerHTML = "";
    posts.forEach(showPost);
    statusLine.textContent = `Загружено постов: ${posts.length}`;
  });
}

/* ---------- POST: добавить пост из формы ---------- */
form.onsubmit = (event) => {
  event.preventDefault(); // не перезагружаем страницу

  const post = {
    title: titleInput.value,
    body: bodyInput.value,
    userId: 1,
  };

  statusLine.textContent = "Отправка...";

  ajax("POST", "/posts", post, (error, created) => {
    if (error) {
      statusLine.textContent = error;
      return;
    }

    showPost(created);
    form.reset();
    statusLine.textContent = `Пост добавлен, id = ${created.id}`;
  });
};

/* ---------- DELETE: удалить пост ---------- */
function deletePost(id, li) {
  statusLine.textContent = "Удаление...";

  ajax("DELETE", `/posts/${id}`, null, (error) => {
    if (error) {
      statusLine.textContent = error;
      return;
    }

    li.remove();
    statusLine.textContent = `Пост ${id} удалён`;
  });
}

/* ---------- Старт: загружаем посты ---------- */
loadPosts();
