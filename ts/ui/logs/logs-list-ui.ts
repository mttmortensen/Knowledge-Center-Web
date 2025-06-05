import { getAllLogs } from "../../services/log-services.js";
import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";
import { LogEntry } from "../../types/log-entry.js";

document.addEventListener("DOMContentLoaded", () => 
{
    // === Logs List Page Logic ===
    const logListContainer = document.getElementById("log-list");
    if(logListContainer) 
    {
        loadAndRenderLogList(logListContainer);
    }

    // === Back button ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }
});

async function loadAndRenderLogList(container: HTMLElement) {
    const logs = await getAllLogs();
    const knowledgeNodes = await getAllKnowledgeNodes();

    if (logs.length === 0) {
        container.textContent = "No log entries found.";
        return;
    }

    // Group logs by NodeId
    const logsByNode: Record<number, LogEntry[]> = {};
    logs.forEach(log => {
        if (!logsByNode[log.NodeId]) {
            logsByNode[log.NodeId] = [];
        }
        logsByNode[log.NodeId].push(log);
    });

    // Render logs grouped by Knowledge Node title
    Object.entries(logsByNode).forEach(([nodeIdStr, logsForNode]) => {
        const nodeId = parseInt(nodeIdStr);
        const node = knowledgeNodes.find(kn => kn.Id === nodeId);

        const title = node ? node.Title : `Unknown Node (ID: ${nodeId})`;

        const header = document.createElement("h3");
        header.textContent = title;
        container.appendChild(header);

        const ul = document.createElement("ul");

        logsForNode.forEach(log => {
            const li = document.createElement("li");

            const button = document.createElement("button");
            const preview = log.Content.length > 50
                ? log.Content.substring(0, 50) + "..."
                : log.Content;

            button.textContent = preview;
            button.addEventListener("click", () => {
                window.location.href = `/logs/logs-details.html?id=${log.LogId}`;
            });

            li.appendChild(button);
            ul.appendChild(li);
        });

        container.appendChild(ul);
    });
}
