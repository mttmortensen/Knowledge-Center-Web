import { getADomainById, updateADomain } from "../../services/domain-services.js";
import { Domains } from "../../types/domains.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";
import { validateField } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const domainId = getDomainIdFromUrl();
    const domainForm = document.getElementById("edit-domain-form") as HTMLFormElement;

    if (domainId == null) 
    {
        displayError(domainForm, "No Domain ID provided in URL.");
        return;
    }

    const domain = await getADomainById(domainId);

    if (!domain) 
    {
        displayError(domainForm, `Could not load Domain with ID ${domainId}.`);
        return;
    }

    prefillForm(domain);

    const form = document.getElementById("edit-domain-form") as HTMLFormElement;
    form.addEventListener("submit", async (e) => 
    {
        e.preventDefault();

        const formData = new FormData(form);

        const updatedDomain: Domains = {
            domainId: domain.domainId,
            domainName: formData.get("domain-name") as string,
            domainDescription: formData.get("domain-description") as string,
            domainStatus: formData.get("domain-status") as string,
            createdAt: domain.createdAt,         // Preserve original timestamps
            lastUsed: domain.lastUsed
        };

        if 
        (
            !validateField(updatedDomain.domainName, { label: "Domain Name", required: true, minLength: 3, maxLength: 100 }) ||
            !validateField(updatedDomain.domainDescription, { label: "Domain Description", required: true, minLength: 10, maxLength: 500 }) ||
            !validateField(updatedDomain.domainStatus, { label: "Domain Status", required: true, allowedValues: ["Active", "Inactive"] })
        ) 
        {
            console.error("❌ One or more validation checks failed.");
            return;
        }


        const success = await updateADomain(updatedDomain);

        if (success) {
            alert("✅ Domain updated!");
            window.location.href = "/html/domains/domains-main.html";
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
    (document.getElementById("domain-id") as HTMLInputElement).value = domain.domainId.toString();
    (document.getElementById("domain-name") as HTMLInputElement).value = domain.domainName;
    (document.getElementById("domain-description") as HTMLTextAreaElement).value = domain.domainDescription;

    const statusRadio = document.querySelector(`input[name="domain-status"][value="${domain.domainStatus}"]`) as HTMLInputElement;
    if (statusRadio) statusRadio.checked = true;
}
