import { getAllTags } from "../../services/tag-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === Tags List Page Logic ===
    const tagListContainer = document.getElementById("tag-list");
    if(tagListContainer) 
    {
        loadAndRenderTagList(tagListContainer);
    }
});

async function loadAndRenderTagList(container: HTMLElement) 
{
    const tags = await getAllTags();

    if (tags.length == 0) 
    {
        displayError(container, "No Tags found.");
        return;
    }

    tags.forEach(tag => 
    {
        const li = document.createElement("li");
        
        const p = document.createElement("p");
        p.textContent = `${tag.Name}`;

        li.appendChild(p);
        container.appendChild(li);
    });
}