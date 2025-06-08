import { createTag } from "../../services/tag-service.js";

document.addEventListener("DOMContentLoaded", () => 
{
    const form = document.getElementById("tag-form") as HTMLFormElement;

    if (form) {
        form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const Name = formData.get("tagName") as string;

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

    // === Back button ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }

});