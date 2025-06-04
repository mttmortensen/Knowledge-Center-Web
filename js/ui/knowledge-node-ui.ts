import { getAllKnowledgeNodes } from "../services/knowledge-node-service";

document.addEventListener("DOMContentLoaded", () => 
{
    const viewBtn = document.getElementById("view-nodes");

    if (viewBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            const nodes = await getAllKnowledgeNodes();
            console.log(`Knowledge Nodes: ${nodes}`)
        })
    }
})