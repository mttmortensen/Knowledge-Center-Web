import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    setupNodeNav("view-nodes", "/html/kn/knowledge-nodes-list.html");
    setupNodeNav("create-node", "/html/kn/knowledge-nodes-create.html");
    setupNodeNav("update-node", "/html/kn/knowledge-nodes-list-update.html");
    setupNodeNav("delete-node", "/html/kn/knowledge-nodes-list-delete.html");

})

// This allows me to avoid repeating the same setup of code for each button 
// And avoiding a nested conditional hell. 
// I can also check if the user is in Demo mode
// If 'True' it disables the update and delete buttons
function setupNodeNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId) as HTMLButtonElement | null;

    if (!btn) return;

    const isDemo = sessionStorage.getItem("isDemo") === "true";

    // === If in demo mode, disable delete/update routes ===
    if (isDemo && (buttonId === "update-node" || buttonId === "delete-node")) 
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


