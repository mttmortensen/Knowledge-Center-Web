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
function setupNodeNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId);
    if (btn) 
    {
        btn.addEventListener("click", () => {
            window.location.href = targetUrl;
        });
    }
}


