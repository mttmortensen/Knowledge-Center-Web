import { getAllDomains } from "../../services/domain-services.js";

document.addEventListener("DOMContentLoaded", () => 
{
    // === Domain List Page Logic ===
    const nodeListContainer = document.getElementById("domain-list");
    if(nodeListContainer) 
    {
        loadAndRenderDomainList(nodeListContainer);
    }

    // === Back button for Domain List Page ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }
});

async function loadAndRenderDomainList(container: HTMLElement) 
{
    const domains = await getAllDomains();

    if (domains.length == 0) 
    {
        container.textContent = "No Domains found.";
        return;
    }

    domains.forEach(domain => 
    {
        const li = document.createElement("li");
        
        const button = document.createElement("button");
        button.textContent = `${domain.DomainName}`;
        button.addEventListener("click", () => 
        {
            window.location.href = `/domain/domain-details.html?id=${domain.DomainId}`;
        });

        li.appendChild(button);
        container.appendChild(li);
    });
}