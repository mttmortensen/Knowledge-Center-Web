import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    setupDomainNav("view-domains", "/html/domains/domains-list.html")
    setupDomainNav("create-domain", "/html/domains/domains-create.html")
    setupDomainNav("update-domain", "/html/domains/domains-list-update.html")
    setupDomainNav("delete-domain", "/html/domains/domains-list-delete.html")

})


// This allows me to avoid repeating the same setup of code for each button 
// And avoiding a nested conditional hell. 
// I can also check if the user is in Demo mode
// If 'True' it disables the update and delete buttons
function setupDomainNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId) as HTMLButtonElement | null;

    if (!btn) return;

    const isDemo = sessionStorage.getItem("isDemo") === "true";
    console.log(isDemo)

    // === If in demo mode, disable delete/update routes ===
    if (isDemo && (buttonId === "update-domain" || buttonId === "delete-domain")) 
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