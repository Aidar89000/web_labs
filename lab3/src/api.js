const API = "https://jsonplaceholder.typicode.com";

/* Запрос к API одной функцией:
   request(метод, путь, данные) -> Promise с ответом сервера.
   При ошибке бросает Error с текстом для пользователя. */
export async function request(method, url, data) {
  let response;

  try {
    response = await fetch(API + url, {
      method,
      // Для POST сообщаем серверу, что отправляем JSON
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
    });
  } catch {
    throw new Error("Нет соединения с сервером");
  }

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  return response.json();
}
