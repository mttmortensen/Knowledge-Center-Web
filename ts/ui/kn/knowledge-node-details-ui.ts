import { getAKnowledgeNodeById } from "../../services/knowledge-node-service.js";
import { getADomainById } from "../../services/domain-services.js";
import { KnowledgeNodeWithLogs } from "../../types/knowledge-node.js";
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

    const domain = await getADomainById(node.DomainId);

    if (!domain) {
        displayError(knNodeContainer, `Could not load Domain with ID ${node.DomainId}.`);
    return;
    }

    renderNodeDetails(node, domain.DomainName);
});

function getNodeIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function renderNodeDetails(node: KnowledgeNodeWithLogs, domainName: string)
{
    (document.getElementById("kn-title") as HTMLElement).textContent = node.Title;
    (document.getElementById("kn-type") as HTMLElement).textContent = node.NodeType;
    (document.getElementById("kn-domain") as HTMLElement).textContent = domainName;
    (document.getElementById("kn-description") as HTMLElement).textContent = node.Description;
    (document.getElementById("kn-confidence") as HTMLElement).textContent = node.ConfidenceLevel.toString();
    (document.getElementById("kn-status") as HTMLElement).textContent = node.Status;
    (document.getElementById("kn-created") as HTMLElement).textContent = node.CreatedAt;
    (document.getElementById("kn-updated") as HTMLElement).textContent = node.LastUpdated;

    // Logs attached to a KnowledgeNode
    const logsListContainer = document.getElementById("kn-logs-list") as HTMLElement;
    logsListContainer.innerHTML = ""; // Clear in case of rerender

    if (node.Logs && node.Logs.length > 0) {
        node.Logs.forEach(log => {
            const btn = document.createElement("button");

            btn.textContent = log.Content.length > 20
                ? log.Content.slice(0, 20) + "..."
                : log.Content;

            btn.classList.add("log-link-button");
            btn.addEventListener("click", () => {
                window.location.href = `/html/logs/logs-details.html?id=${log.LogId}`;
            });
            logsListContainer.appendChild(btn);
        });
    } else {
        logsListContainer.textContent = "No logs found for this Knowledge Node.";
    }   
}