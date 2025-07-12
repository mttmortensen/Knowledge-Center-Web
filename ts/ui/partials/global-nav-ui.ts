document.addEventListener("DOMContentLoaded", () => {

  // === Checking and Loading the Demo Mode Banner ===
  if (sessionStorage.getItem("isDemo") === "true") 
  {
    const banner = document.createElement("div");
    banner.textContent = "🔒 DEMO MODE: Your changes will not be saved.";
    banner.style.backgroundColor = "#ffecb3";
    banner.style.color = "#000";
    banner.style.padding = "12px";
    banner.style.textAlign = "center";
    banner.style.fontWeight = "bold";
    banner.style.borderBottom = "2px solid #f1c40f";
    banner.style.fontSize = "16px";
    banner.style.position = "sticky";
    banner.style.top = "0";
    banner.style.zIndex = "1000";
    banner.setAttribute("data-banner", "demo-mode");

    // Optional close button
    const closeBtn = document.createElement("span");
    closeBtn.textContent = "✖";
    closeBtn.style.float = "right";
    closeBtn.style.marginRight = "15px";
    closeBtn.style.cursor = "pointer";
    closeBtn.addEventListener("click", () => banner.remove());

    banner.appendChild(closeBtn);
    document.body.prepend(banner);
  }
    
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
      sessionStorage.removeItem("isDemo");
      window.location.href = "/login.html";
    });
  }
});
