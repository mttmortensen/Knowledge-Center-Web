import { getADomainById } from "../../services/domain-services.js";
import { Domains } from "../../types/domains.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const domainId = getDomainIdFromUrl();
    const container = document.getElementById("domain-details") as HTMLElement;

    if (domainId == null)
    {
        displayError(container, "No Domain ID provided in URL.");
        return;
    }

    const domain = await getADomainById(domainId);

    if(!domain) 
    {
        displayError(container, `Could not load Domain with ID ${domainId}.`);
        return;
    }

    renderDomainDetails(domain);

});

function getDomainIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function renderDomainDetails(domain: Domains)
{
    (document.getElementById("domain-name") as HTMLElement).textContent = domain.domainName;
    (document.getElementById("domain-description") as HTMLElement).textContent = domain.DomainDescription;
    (document.getElementById("domain-status") as HTMLElement).textContent = domain.DomainStatus;
    (document.getElementById("domain-created") as HTMLElement).textContent = domain.CreatedAt;
    (document.getElementById("domain-updated") as HTMLElement).textContent = domain.LastUsed;
}