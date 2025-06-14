import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    // === KN List Page Logic ===
    const nodeListContainer = document.getElementById("node-list");
    if(nodeListContainer) 
    {
        loadAndRenderNodeList(nodeListContainer);
    }
});

async function loadAndRenderNodeList(container: HTMLElement) 
{
    const nodes = await getAllKnowledgeNodes();

    if (nodes.length == 0) 
    {
        displayError(container, "No Knowledge Nodes found.");
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