import { getAllDomains } from "../../services/domain-services.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const domainListDiv = document.getElementById("domain-list") as HTMLElement;
    const form = document.getElementById("domain-update-form") as HTMLFormElement;

    try 
    {
        const domains = await getAllDomains();

        if (domains.length === 0) 
        {
            displayError(domainListDiv, "No Domains found to Edit");
            return;
        }

        domains.forEach(domain => 
        {
            const wrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "domain";
            radio.value = domain.DomainId.toString();
            radio.id = `domain-${domain.DomainId}`;

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.textContent = `${domain.DomainName}`;

            wrapper.appendChild(radio);
            wrapper.appendChild(label);

            domainListDiv!.appendChild(wrapper);
        });
    } 
    catch (err) 
    {
            displayError(domainListDiv, "Failed to Load Domains.");
        console.error("Error fetching domains:", err);
    }

    form.addEventListener("submit", (e) => 
    {
        e.preventDefault();
        const selected = document.querySelector("input[name='domain']:checked") as HTMLInputElement;

        if (!selected) 
        {
            alert("Please select a Domain to edit.");
            return;
        }

        const domainId = selected.value;
        window.location.href = `/domains/domains-details-update.html?id=${domainId}`;
    });

    const backBtn = document.getElementById("back-button");
    backBtn?.addEventListener("click", () => {
        window.history.back();
    });
});
