import { authFetch } from "./fetch-wrapper.js";

const loginForm = document.getElementById("login-form") as HTMLFormElement;
const demoLoginButton = document.getElementById("demo-login-btn") as HTMLButtonElement;
const errorMessage = document.getElementById("error-message") as HTMLParagraphElement;

const API_BASE_URL = "https://api.mortensens.xyz/kc/api";


// This is to handle when a user hits that login button
loginForm.addEventListener("submit", async (event) => 
{
  event.preventDefault(); // Stop form from refreshing the page

  const username = (document.getElementById("username") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  const body = { username, password };

  try {
    const response = await authFetch(`${API_BASE_URL}/auth/login`, 
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

// This is to handle when a user hits the demo button 
demoLoginButton.addEventListener("click", async () => 
{
  try 
  {
    const response = await authFetch(`${API_BASE_URL}/auth/demo`, 
    {
      method: "POST"
    });
    
    if (response.ok) 
    {
      const data = await response.json();
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("isDemo", "true");
      
      // Redirect to main page
      window.location.href = "/index.html"
    }
    else 
    {
      errorMessage.textContent = "Failed to start demo mode.";      
    }
  }
  catch (err) 
  {
    console.error("Demo login failed: ", err);
    errorMessage.textContent = "Something went wrong when entering demo mode.";
  }
});