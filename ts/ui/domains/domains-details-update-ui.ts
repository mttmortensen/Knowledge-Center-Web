import { getADomainById, updateADomain } from "../../services/domain-services.js";
import { Domains } from "../../types/domains.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const domainId = getDomainIdFromUrl();

    if (domainId == null) 
    {
        alert("❌ No Domain ID provided in URL.");
        return;
    }

    const domain = await getADomainById(domainId);

    if (!domain) 
    {
        alert(`❌ Could not load Domain with ID ${domainId}.`);
        return;
    }

    prefillForm(domain);

    const form = document.getElementById("edit-domain-form") as HTMLFormElement;
    form.addEventListener("submit", async (e) => 
    {
        e.preventDefault();

        const formData = new FormData(form);

        const updatedDomain: Domains = {
            DomainId: domain.DomainId,
            DomainName: formData.get("domain-name") as string,
            DomainDescription: formData.get("domain-description") as string,
            DomainStatus: formData.get("domain-status") as string,
            CreatedAt: domain.CreatedAt,         // Preserve original timestamps
            LastUsed: domain.LastUsed
        };

        const success = await updateADomain(updatedDomain);

        if (success) {
            alert("✅ Domain updated!");
            window.location.href = "/domains/domains-main.html";
        } else {
            alert("❌ Failed to update Domain.");
        }
    });

    const backBtn = document.getElementById("back-button");
    backBtn?.addEventListener("click", () => {
        window.history.back();
    });
});

function getDomainIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function prefillForm(domain: Domains) 
{
    (document.getElementById("domain-id") as HTMLInputElement).value = domain.DomainId.toString();
    (document.getElementById("domain-name") as HTMLInputElement).value = domain.DomainName;
    (document.getElementById("domain-description") as HTMLTextAreaElement).value = domain.DomainDescription;

    const statusRadio = document.querySelector(`input[name="domain-status"][value="${domain.DomainStatus}"]`) as HTMLInputElement;
    if (statusRadio) statusRadio.checked = true;
}
