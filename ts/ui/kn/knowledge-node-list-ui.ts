import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === KN List Page Logic ===
    const nodeListContainer = document.getElementById("node-list");
    if(nodeListContainer) 
    {
        loadAndRenderNodeList(nodeListContainer);
    }

    // === Back button for KN List Page ===
    const backBtn = document.getElementById("back-to-menu");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }
});

async function loadAndRenderNodeList(container: HTMLElement) 
{
    const nodes = await getAllKnowledgeNodes();

    if (nodes.length == 0) 
    {
        container.textContent = "No Knowledge Nodes found.";
        return;
    }

    nodes.forEach(node => 
    {
        const li = document.createElement("li");
        
        const button = document.createElement("button");
        button.textContent = `${node.Title}`;
        button.addEventListener("click", () => 
        {
            window.location.href = `/kn/knowledge-nodes-details.html?id=${node.Id}`;
        });

        li.appendChild(button);
        container.appendChild(li);
    });
}