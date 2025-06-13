import { getADomainById } from "../../services/domain-services.js";
import { Domains } from "../../types/domains.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const domainId = getDomainIdFromUrl();

    if (domainId == null)
    {
        displayError("No Domain ID provided in URL.");
        return;
    }

    const domain = await getADomainById(domainId);

    if(!domain) 
    {
        displayError(`Could not load Domain with ID ${domainId}.`);
        return;
    }

    renderDomainDetails(domain);

    // === Back button for KN List Page ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
             window.history.back();
        });
    }
});

function getDomainIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function displayError(message: string) 
{
    const container = document.getElementById("domain-details");
    if (container)
    {
        const p = document.createElement("p");
        p.style.color = "red";
        p.textContent = message; // ← safely inserts raw text only
        container.innerHTML = ""; // Clear existing content if needed
        container.appendChild(p);
    }
}

function renderDomainDetails(domain: Domains)
{
    (document.getElementById("domain-name") as HTMLElement).textContent = domain.DomainName;
    (document.getElementById("domain-description") as HTMLElement).textContent = domain.DomainDescription;
    (document.getElementById("domain-status") as HTMLElement).textContent = domain.DomainStatus;
    (document.getElementById("domain-created") as HTMLElement).textContent = domain.CreatedAt;
    (document.getElementById("domain-updated") as HTMLElement).textContent = domain.LastUsed;
}