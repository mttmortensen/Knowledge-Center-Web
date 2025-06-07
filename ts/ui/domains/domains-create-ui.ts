import { createDomain } from "../../services/domain-services.js";

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

    // === Back button ===
    const backBtn = document.getElementById("back-button");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.history.back();
        });
    }
});
