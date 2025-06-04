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