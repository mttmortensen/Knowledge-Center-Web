import { getAKnowledgeNodeById } from "../../services/knowledge-node-service.js";
import { KnowledgeNode } from "../../types/knowledge-node.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const nodeId = getNodeIdFromUrl();

    if (nodeId == null)
    {
        displayError("No Knowledge Node ID provided in URL.");
        return;
    }

    const node = await getAKnowledgeNodeById(nodeId);

    if(!node) 
    {
        displayError(`Could not load Knowledge Node with ID ${nodeId}.`);
        return;
    }

    renderNodeDetails(node);

    // === Back button for KN List Page ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
             window.history.back();
        });
    }
});

function getNodeIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function displayError(message: string) 
{
    const container = document.getElementById("kn-details");
    if (container)
    {
        container.innerHTML = `<p style="color:red;">${message}<\p>`;
    }
}

function renderNodeDetails(node: KnowledgeNode)
{
    (document.getElementById("kn-title") as HTMLElement).textContent = node.Title;
    (document.getElementById("kn-type") as HTMLElement).textContent = node.NodeType;
    (document.getElementById("kn-description") as HTMLElement).textContent = node.Description;
    (document.getElementById("kn-confidence") as HTMLElement).textContent = node.ConfidenceLevel.toString();
    (document.getElementById("kn-status") as HTMLElement).textContent = node.Status;
    (document.getElementById("kn-created") as HTMLElement).textContent = node.CreatedAt;
    (document.getElementById("kn-updated") as HTMLElement).textContent = node.LastUpdated;
}