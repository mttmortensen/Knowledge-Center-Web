import { getAllLogs } from "../../services/log-services.js";

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

async function loadAndRenderLogList(container: HTMLElement) 
{
    const logs = await getAllLogs();

    if (logs.length == 0) 
    {
        container.textContent = "No Knowledge Nodes found.";
        return;
    }

    logs.forEach(log => 
    {
        const li = document.createElement("li");
        
        const button = document.createElement("button");
        button.textContent = `${log.Content}`;
        button.addEventListener("click", () => 
        {
            window.location.href = `/logs/logs-details.html?id=${log.LogId}`;
        });

        li.appendChild(button);
        container.appendChild(li);
    });
}