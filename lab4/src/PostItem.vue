<script setup>
/* Один пост в списке. Данные приходят через props,
   а о нажатии «Удалить» компонент сообщает родителю событием */
defineProps({
  post: { type: Object, required: true },
});

defineEmits(["delete"]);
</script>

<template>
  <li>
    <h3>{{ post.title }}</h3>
    <p>{{ post.body }}</p>
    <button @click="$emit('delete', post)">Удалить</button>
  </li>
</template>
