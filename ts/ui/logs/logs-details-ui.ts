import { getALogById } from "../../services/log-services.js";
import { LogEntry } from "../../types/log-entry.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const logId = getLogIdFromUrl();
    const logDetailsContainer = document.getElementById("log-details") as HTMLElement;

    if (logId == null)
    {
        displayError(logDetailsContainer, "No Log ID provided in URL.");
        return;
    }

    const log = await getALogById(logId);

    if(!log) 
    {
        displayError(logDetailsContainer, `Could not load Log with ID ${logId}.`);
        return;
    }

    renderLogDetails(log);
});

function getLogIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function renderLogDetails(log: LogEntry)
{
    (document.getElementById("log-content") as HTMLElement).textContent = log.Content;
    (document.getElementById("log-entry-date") as HTMLElement).textContent = log.EntryDate;
    (document.getElementById("log-progress") as HTMLElement).textContent = log.ContributesToProgress.toString();
}