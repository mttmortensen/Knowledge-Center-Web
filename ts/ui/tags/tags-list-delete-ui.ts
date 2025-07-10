import { getAllTags, deleteATag } from "../../services/tag-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => {
    const tagListDiv = document.getElementById("tag-list") as HTMLElement;
    const form = document.getElementById("tag-delete-form") as HTMLFormElement;

    try {
        const tags = await getAllTags();

        if (tags.length === 0) {
            displayError(tagListDiv, "No Tags found.");
            return;
        }

        tags.forEach(tag => {
            const wrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "tag";
            radio.value = tag.TagId.toString();
            radio.id = `tag-${tag.TagId}`;

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.textContent = tag.Name;

            wrapper.appendChild(radio);
            wrapper.appendChild(label);

            tagListDiv!.appendChild(wrapper);
        });
    } catch (err) {
        displayError(tagListDiv, "Failed to load tags.");
        console.error("Error fetching tags:", err);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const selected = document.querySelector("input[name='tag']:checked") as HTMLInputElement;
        if (!selected) {
            alert("Please select a tag to delete.");
            return;
        }

        const tagId = parseInt(selected.value);
        const confirmed = confirm("Are you sure you want to delete this tag?");
        if (!confirmed) return;

        const success = await deleteATag(tagId);

        if (success) {
            alert("✅ Tag deleted!");
            window.location.href = "/html/tags/tags-main.html";
        } else {
            alert("❌ Failed to delete tag.");
        }
    });

    const backBtn = document.getElementById("back-button");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            window.history.back();
        });
    }
});
