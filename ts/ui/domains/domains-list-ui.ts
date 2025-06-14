import { getAllDomains } from "../../services/domain-services.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Domain List Page Logic ===
    const nodeListContainer = document.getElementById("domain-list");
    if(nodeListContainer) 
    {
        loadAndRenderDomainList(nodeListContainer);
    }

});

async function loadAndRenderDomainList(container: HTMLElement) 
{
    const domains = await getAllDomains();

    if (domains.length == 0) 
    {
        displayError(container, "No Domains Found");
        return;
    }

    domains.forEach(domain => 
    {
        const li = document.createElement("li");
        
        const button = document.createElement("button");
        button.textContent = `${domain.DomainName}`;
        button.addEventListener("click", () => 
        {
            window.location.href = `/domains/domains-details.html?id=${domain.DomainId}`;
        });

        li.appendChild(button);
        container.appendChild(li);
    });
}