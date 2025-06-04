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
})