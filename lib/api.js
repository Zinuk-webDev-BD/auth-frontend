// base url of our backend, it comes from .env.local
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// the login token is kept in the browser's localStorage
export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};
export const saveToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

// one function to call every backend api
export async function apiRequest(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();

  // send the token if the user is logged in
  if (token) headers.Authorization = "Bearer " + token;

  // normal data goes as json, a file (FormData) is sent as it is
  let requestBody;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(API_URL + path, {
    method,
    headers,
    body: requestBody,
  });

  // read the json answer (it can be empty when something breaks)
  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  // if the backend says error, throw it with the backend's message
  if (!response.ok) {
    const error = new Error(data.message || "something went wrong");
    error.status = response.status;
    throw error;
  }

  return data;
}