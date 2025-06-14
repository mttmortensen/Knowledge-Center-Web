import { getAKnowledgeNodeById } from "../../services/knowledge-node-service.js";
import { KnowledgeNode } from "../../types/knowledge-node.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const nodeId = getNodeIdFromUrl();
    const knNodeContainer = document.getElementById("kn-details") as HTMLElement;

    if (nodeId == null)
    {
        displayError(knNodeContainer, "No Knowledge Node ID provided in URL.");
        return;
    }

    const node = await getAKnowledgeNodeById(nodeId);

    if(!node) 
    {
        displayError(knNodeContainer, `Could not load Knowledge Node with ID ${nodeId}.`);
        return;
    }

    renderNodeDetails(node);
});

function getNodeIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
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