/* Один пост в списке. Данные и действие приходят через props */
function PostItem({ post, onDelete }) {
  return (
    <li>
      <h3>{post.title}</h3>
      <p>{post.body}</p>
      <button onClick={() => onDelete(post)}>Удалить</button>
    </li>
  );
}

export default PostItem;
