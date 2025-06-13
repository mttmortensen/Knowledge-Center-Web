import { getATagById, updateATag } from "../../services/tag-service.js";
import { Tag } from "../../types/tags.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const tagId = getTagIdFromUrl();

    if (tagId == null) 
    {
        alert("❌ No Tag ID provided in URL.");
        return;
    }

    const tag = await getATagById(tagId);

    if (!tag) 
    {
        alert(`❌ Could not load Tag with ID ${tagId}.`);
        return;
    }

    prefillForm(tag);

    const form = document.getElementById("edit-tag-form") as HTMLFormElement;
    form.addEventListener("submit", async (e) => 
    {
        e.preventDefault();

        const formData = new FormData(form);

        const updatedTag: Tag = {
            TagId: tag.TagId,
            Name: formData.get("tag-name") as string
        };

        const success = await updateATag(updatedTag);

        if (success) {
            alert("✅ Tag updated!");
            window.location.href = "/tags/tags-main.html";
        } else {
            alert("❌ Failed to update Tag.");
        }
    });

    const backBtn = document.getElementById("back-button");
    backBtn?.addEventListener("click", () => {
        window.history.back();
    });
});

function getTagIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function prefillForm(tag: Tag) 
{
    (document.getElementById("tag-id") as HTMLInputElement).value = tag.TagId.toString();
    (document.getElementById("tag-name") as HTMLInputElement).value = tag.Name;
}
