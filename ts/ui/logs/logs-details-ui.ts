import { getALogById } from "../../services/log-services.js";
import { LogEntry } from "../../types/log-entry.js";
import { requireAuth } from "../../services/auth-check.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const logId = getLogIdFromUrl();

    if (logId == null)
    {
        displayError("No Knowledge Node ID provided in URL.");
        return;
    }

    const log = await getALogById(logId);

    if(!log) 
    {
        displayError(`Could not load Knowledge Node with ID ${logId}.`);
        return;
    }

    renderLogDetails(log);

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

function getLogIdFromUrl(): number | null 
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

function renderLogDetails(log: LogEntry)
{
    (document.getElementById("log-content") as HTMLElement).textContent = log.Content;
    (document.getElementById("log-entry-date") as HTMLElement).textContent = log.EntryDate;
    (document.getElementById("log-progress") as HTMLElement).textContent = log.ContributesToProgress.toString();
}