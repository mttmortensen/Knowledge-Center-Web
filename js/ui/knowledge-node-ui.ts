import { getAllKnowledgeNodes } from "../services/knowledge-node-service.js";

document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    const viewBtn = document.getElementById("view-nodes");

    if (viewBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            const nodes = await getAllKnowledgeNodes();
            console.log("Knowledge Nodes:", nodes)
        })
    }

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
})

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
        const button = document.createElement("button");
        button.textContent = `${node.Title}`;
        button.style.display = "block";
        button.style.marginBottom = "10px";

        // This will be a future feature
        button.addEventListener("click", () => 
        {
            console.log("Clicked Node: ", node);
        });
        // 

        container.appendChild(button);
    });
}