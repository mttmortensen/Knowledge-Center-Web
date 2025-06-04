import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";

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
            window.location.href = "knowledge-nodes-main.html";
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

        // This will be a future feature
        button.addEventListener("click", () => 
        {
            window.location.href = "knowledge-nodes-deatils.html"
        });
        // 

        li.appendChild(button);
        container.appendChild(li);
    });
}