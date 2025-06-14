import { createDomain } from "../../services/domain-services.js";
import { requireAuth } from "../../services/auth-check.js";
import { validateField } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    const form = document.getElementById("domain-form") as HTMLFormElement;

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);

            const DomainName = formData.get("name") as string;
            const DomainDescription = formData.get("description") as string;
            const DomainStatus = formData.get("status") as string;
            
            // === ✅ Validation ===
            if 
            (
                !validateField(DomainName, { label: "Domain Name", required: true, minLength: 3, maxLength: 100 }) ||
                !validateField(DomainDescription, { label: "Domain Description", required: true, minLength: 10, maxLength: 500 }) ||
                !validateField(DomainStatus, { label: "Domain Status", required: true, allowedValues: ["Active", "Inactive"] })
            ) 
            {
                console.error("❌ One or more validation checks failed.");
                return;
            }

            const now = new Date().toISOString();

            const newDomain = {
                DomainName,
                DomainDescription,
                DomainStatus,
                CreatedAt: now,
                LastUsed: now
            };

            const success = await createDomain(newDomain);

            if (success) {
                alert("✅ Domain created!");
                window.location.href = "domains-main.html"; // or wherever your domain list lives
            } else {
                alert("❌ Failed to create domain.");
            }
        });
    }

});
