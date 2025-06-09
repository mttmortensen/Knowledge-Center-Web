import { getAllDomains } from "../../services/domain-services.js";

document.addEventListener("DOMContentLoaded", async () => 
{
    const domainListDiv = document.getElementById("domain-list");
    const form = document.getElementById("domain-update-form") as HTMLFormElement;

    try 
    {
        const domains = await getAllDomains();

        if (domains.length === 0) 
        {
            domainListDiv!.innerHTML = "<p>No Domains found.</p>";
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
        domainListDiv!.innerHTML = "<p>Failed to load Domains.</p>";
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
