// backend url comes from the env file (.env.local on your pc, Vercel settings when live)
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// calls a protected backend api with the saved login token
export async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const isForm = options.body instanceof FormData;

  const res = await fetch(API_URL + path, {
    method: options.method || "GET",
    headers: {
      // a file upload (FormData) sets its own content type
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      Authorization: "Bearer " + token,
    },
    body: options.body
      ? isForm
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // token is wrong or expired, so send the user to login again
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error(data.message || "please login again");
  }

  if (!res.ok) {
    throw new Error(data.message || "something went wrong");
  }

  return data;
}