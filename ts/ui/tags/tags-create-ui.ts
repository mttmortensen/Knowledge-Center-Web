import { createTag } from "../../services/tag-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { validateField } from "../../services/ui-utils.js";

requireAuth();


document.addEventListener("DOMContentLoaded", () => 
{
    const form = document.getElementById("tag-form") as HTMLFormElement;

    if (form) {
        form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const Name = formData.get("tagName") as string;

        // === ✅ Validation ===
        if 
        (
            !validateField(Name, { label: "Tag Name", required: true, minLength: 3, maxLength: 100 }) 
        ) 
        {
            console.error("❌ One or more validation checks failed.");
            return;
        }

        const newTag = { Name };

        const success = await createTag(newTag);

        if (success) {
            alert("✅ Tag created successfully!");
            window.location.href = "tags-main.html"; // Change if you use a different main page
        } else {
            alert("❌ Failed to create tag.");
        }
        });
    }
});