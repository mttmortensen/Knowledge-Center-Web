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
function setupDomainNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId);
    if (btn) 
    {
        btn.addEventListener("click", () => {
            window.location.href = targetUrl;
        });
    }
}