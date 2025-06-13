import { getAllTags } from "../../services/tag-service.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();


document.addEventListener("DOMContentLoaded", () => 
{
    // === Tags List Page Logic ===
    const tagListContainer = document.getElementById("tag-list");
    if(tagListContainer) 
    {
        loadAndRenderTagList(tagListContainer);
    }

    // === Back button for Tag List Page ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }
});

async function loadAndRenderTagList(container: HTMLElement) 
{
    const tags = await getAllTags();

    if (tags.length == 0) 
    {
        container.textContent = "No Tags found.";
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