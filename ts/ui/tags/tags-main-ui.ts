import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    setupTagNav("view-tags", "/html/tags/tags-list.html")
    setupTagNav("create-tag", "/html/tags/tags-create.html")
    setupTagNav("update-tag", "/html/tags/tags-list-update.html")
    setupTagNav("delete-tag", "/html/tags/tags-list-delete.html")

})

// This allows me to avoid repeating the same setup of code for each button 
// And avoiding a nested conditional hell. 
// I can also check if the user is in Demo mode
// If 'True' it disables the update and delete buttons
function setupTagNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId) as HTMLButtonElement | null;

    if (!btn) return;

    const isDemo = sessionStorage.getItem("isDemo") === "true";
    console.log(isDemo)

    // === If in demo mode, disable delete/update routes ===
    if (isDemo && (buttonId === "update-tag" || buttonId === "delete-tag")) 
    {
        btn.disabled = true;
        btn.textContent += " (Disabled in Demo)";
        btn.style.opacity = "0.6";
        btn.style.cursor = "not-allowed";
        return;
    }

    // === Otherwise, allow normal navigation ===
    btn.addEventListener("click", () => {
        window.location.href = targetUrl;
    });
}