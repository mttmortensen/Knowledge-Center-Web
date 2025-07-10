document.addEventListener("DOMContentLoaded", () => {
  // === Back Button ===
  const backBtn = document.getElementById("back-button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
        window.history.back();
    });
  }

  // === Home Button ===
  const homeBtn = document.getElementById("home-button");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "/index.html";
    });
  }

  // === Logout Button ===
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      const token = sessionStorage.getItem("token");

      if (token) {
        try {
          await fetch("https://api.mortensens.xyz/kc/api/auth/logout", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
        } catch (err) {
          console.error("Error calling logout:", err);
        }
      }

      sessionStorage.removeItem("token");
      window.location.href = "/login.html";
    });
  }
});
