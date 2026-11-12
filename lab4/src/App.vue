<script setup>
import { onMounted, ref } from "vue";
import { request } from "./api";
import PostItem from "./PostItem.vue";

/* JSONPlaceholder на каждый POST отвечает id = 101,
   поэтому для списка заводим свой уникальный ключ */
let nextKey = 0;
const withKey = (post) => ({ ...post, key: nextKey++ });

const posts = ref([]);
const status = ref("Загрузка...");
const title = ref("");
const body = ref("");

/* ---------- GET: загрузить посты при открытии страницы ---------- */
onMounted(async () => {
  try {
    const loaded = await request("GET", "/posts?_limit=10");
    posts.value = loaded.map(withKey);
    status.value = `Загружено постов: ${loaded.length}`;
  } catch (error) {
    status.value = error.message;
  }
});

/* ---------- POST: добавить пост из формы ---------- */
async function addPost() {
  status.value = "Отправка...";

  try {
    const created = await request("POST", "/posts", {
      title: title.value,
      body: body.value,
      userId: 1,
    });
    posts.value.push(withKey(created));
    title.value = "";
    body.value = "";
    status.value = `Пост добавлен, id = ${created.id}`;
  } catch (error) {
    status.value = error.message;
  }
}

/* ---------- DELETE: удалить пост ---------- */
async function deletePost(post) {
  status.value = "Удаление...";

  try {
    await request("DELETE", `/posts/${post.id}`);
    posts.value = posts.value.filter((p) => p.key !== post.key);
    status.value = `Пост ${post.id} удалён`;
  } catch (error) {
    status.value = error.message;
  }
}
</script>

<template>
  <h1>Посты с JSONPlaceholder</h1>

  <!-- .prevent — то же, что event.preventDefault(): страница не перезагружается -->
  <form @submit.prevent="addPost">
    <input v-model="title" type="text" placeholder="Заголовок" required>
    <input v-model="body" type="text" placeholder="Текст" required>
    <button type="submit">Добавить</button>
  </form>

  <p id="status">{{ status }}</p>

  <ul id="list">
    <PostItem
      v-for="post in posts"
      :key="post.key"
      :post="post"
      @delete="deletePost"
    />
  </ul>
</template>
