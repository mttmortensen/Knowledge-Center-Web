import { authFetch } from "./fetch-wrapper.js";

const loginForm = document.getElementById("login-form") as HTMLFormElement;
const errorMessage = document.getElementById("error-message") as HTMLParagraphElement;

const API_BASE_URL = "https://api.mortensens.xyz/kc/api/login";

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault(); // Stop form from refreshing the page

  const username = (document.getElementById("username") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  const body = { username, password };

  try {
    const response = await authFetch(API_BASE_URL, 
    {
      method: "POST",
      body: JSON.stringify(body)
    });

    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem("token", data.token);

      // Redirect to your main page (change if needed)
      window.location.href = "/index.html";
    } else {
      const errorText = await response.text();
      errorMessage.textContent = errorText || "Invalid credentials.";
    }
  } catch (err) {
    console.error("Login failed:", err);
    errorMessage.textContent = "Something went wrong. Please try again.";
  }
});
