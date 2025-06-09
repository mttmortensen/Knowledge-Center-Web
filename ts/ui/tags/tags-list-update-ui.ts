import { getAllTags } from "../../services/tag-service.js";

document.addEventListener("DOMContentLoaded", async () => 
{
    const tagListDiv = document.getElementById("tag-list");
    const form = document.getElementById("tag-update-form") as HTMLFormElement;

    try 
    {
        const tags = await getAllTags();

        if (tags.length === 0) 
        {
            tagListDiv!.innerHTML = "<p>No Tags found.</p>";
            return;
        }

        tags.forEach(tag => 
        {
            const wrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "tag";
            radio.value = tag.TagId.toString();
            radio.id = `tag-${tag.TagId}`;

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.textContent = `${tag.Name}`;

            wrapper.appendChild(radio);
            wrapper.appendChild(label);

            tagListDiv!.appendChild(wrapper);
        });
    } 
    catch (err) 
    {
        tagListDiv!.innerHTML = "<p>Failed to load Tags.</p>";
        console.error("Error fetching tags:", err);
    }

    form.addEventListener("submit", (e) => 
    {
        e.preventDefault();
        const selected = document.querySelector("input[name='tag']:checked") as HTMLInputElement;

        if (!selected) 
        {
            alert("Please select a Tag to edit.");
            return;
        }

        const tagId = selected.value;
        window.location.href = `/ui/tag/tags-details-update.html?id=${tagId}`;
    });

    const backBtn = document.getElementById("back-button");
    backBtn?.addEventListener("click", () => {
        window.history.back();
    });
});
