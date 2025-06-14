import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    setupTagNav("view-tags", "/tags/tags-list.html")
    setupTagNav("create-tag", "/tags/tags-create.html")
    setupTagNav("update-tag", "/tags/tags-list-update.html")
    setupTagNav("delete-tag", "/tags/tags-list-delete.html")

})

// This allows me to avoid repeating the same setup of code for each button 
// And avoiding a nested conditional hell. 
function setupTagNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId);
    if (btn) 
    {
        btn.addEventListener("click", () => {
            window.location.href = targetUrl;
        });
    }
}