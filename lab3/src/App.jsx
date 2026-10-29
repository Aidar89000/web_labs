import { useEffect, useState } from "react";
import { request } from "./api";
import PostItem from "./PostItem";

/* JSONPlaceholder на каждый POST отвечает id = 101,
   поэтому для списка заводим свой уникальный ключ */
let nextKey = 0;
const withKey = (post) => ({ ...post, key: nextKey++ });

function App() {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("Загрузка...");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  /* ---------- GET: загрузить посты при открытии страницы ---------- */
  useEffect(() => {
    let cancelled = false;

    request("GET", "/posts?_limit=10")
      .then((loaded) => {
        if (cancelled) return;
        setPosts(loaded.map(withKey));
        setStatus(`Загружено постов: ${loaded.length}`);
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- POST: добавить пост из формы ---------- */
  const addPost = async (event) => {
    event.preventDefault(); // не перезагружаем страницу
    setStatus("Отправка...");

    try {
      const created = await request("POST", "/posts", { title, body, userId: 1 });
      setPosts((current) => [...current, withKey(created)]);
      setTitle("");
      setBody("");
      setStatus(`Пост добавлен, id = ${created.id}`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  /* ---------- DELETE: удалить пост ---------- */
  const deletePost = async (post) => {
    setStatus("Удаление...");

    try {
      await request("DELETE", `/posts/${post.id}`);
      setPosts((current) => current.filter((p) => p.key !== post.key));
      setStatus(`Пост ${post.id} удалён`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <>
      <h1>Посты с JSONPlaceholder</h1>

      <form onSubmit={addPost}>
        <input
          type="text"
          placeholder="Заголовок"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Текст"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <button type="submit">Добавить</button>
      </form>

      <p id="status">{status}</p>

      <ul id="list">
        {posts.map((post) => (
          <PostItem key={post.key} post={post} onDelete={deletePost} />
        ))}
      </ul>
    </>
  );
}

export default App;
