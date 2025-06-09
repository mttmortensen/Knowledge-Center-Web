import { getAllDomains, deleteADomain } from "../../services/domain-services.js";

document.addEventListener("DOMContentLoaded", async () => {
    const domainListDiv = document.getElementById("domain-list");
    const form = document.getElementById("domain-delete-form") as HTMLFormElement;

    try {
        const domains = await getAllDomains();

        if (domains.length === 0) {
            domainListDiv!.innerHTML = "<p>No Domains found.</p>";
            return;
        }

        domains.forEach(domain => {
            const wrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "domain";
            radio.value = domain.DomainId.toString();
            radio.id = `domain-${domain.DomainId}`;

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.textContent = domain.DomainName;

            wrapper.appendChild(radio);
            wrapper.appendChild(label);

            domainListDiv!.appendChild(wrapper);
        });
    } catch (err) {
        domainListDiv!.innerHTML = "<p>Failed to load domains.</p>";
        console.error("Error fetching domains:", err);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const selected = document.querySelector("input[name='domain']:checked") as HTMLInputElement;
        if (!selected) {
            alert("Please select a domain to delete.");
            return;
        }

        const domainId = parseInt(selected.value);
        const confirmed = confirm("Are you sure you want to delete this domain? Knowledge Nodes using it will still remain.");
        if (!confirmed) return;

        const success = await deleteADomain(domainId);

        if (success) {
            alert("✅ Domain deleted!");
            window.location.href = "/domains/domains-main.html";
        } else {
            alert("❌ Failed to delete domain.");
        }
    });

    const backBtn = document.getElementById("back-button");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.history.back();
        });
    }
});
