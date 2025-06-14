import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Logs Menu Button Logic ===
    const viewBtn = document.getElementById("view-logs");
    const crtBtn = document.getElementById("create-log");

    if (viewBtn && crtBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            window.location.href = "/logs/logs-list.html"
        })

        crtBtn.addEventListener("click", () => 
        {
            window.location.href = "/logs/logs-create.html"
        })
    }
})