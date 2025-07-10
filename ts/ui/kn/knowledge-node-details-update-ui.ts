import { getAKnowledgeNodeById, updateAKnowledgeNode } from "../../services/knowledge-node-service.js";
import { getAllDomains } from "../../services/domain-services.js";
import { KnowledgeNode } from "../../types/knowledge-node.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";
import { validateField } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const nodeId = getNodeIdFromUrl();
    const knDetailsContainer = document.getElementById("edit-node-form") as HTMLFormElement;

    if (nodeId == null)
    {
        displayError(knDetailsContainer, "No Knowledge Node ID provided in URL.");
        return;
    }

    const node = await getAKnowledgeNodeById(nodeId);
    const domains = await getAllDomains();

    if (!node)
    {
        displayError(knDetailsContainer, `Could not load Knowledge Node with ID ${nodeId}.`);
        return;
    }

    populateDomainSelect(domains, node.DomainId);
    populateConfidenceSelect(node.ConfidenceLevel);
    prefillForm(node);

    const form = document.getElementById("edit-node-form") as HTMLFormElement;
    form.addEventListener("submit", async (e) => 
    {
        e.preventDefault();

        const formData = new FormData(form);

        const updatedNode: KnowledgeNode = {
            Id: node.Id,
            Title: formData.get("title") as string,
            DomainId: parseInt(formData.get("domain") as string),
            NodeType: formData.get("nodeType") as string,
            Description: formData.get("description") as string,
            ConfidenceLevel: parseInt(formData.get("confidence") as string),
            Status: formData.get("status") as string,
            CreatedAt: node.CreatedAt,
            LastUpdated: new Date().toISOString()
        };

        if (
            !validateField(updatedNode.Title, { label: "Title", required: true, minLength: 3, maxLength: 100 }) ||
            !validateField(updatedNode.Description, { label: "Description", required: true, minLength: 10, maxLength: 500 }) ||
            !validateField(updatedNode.NodeType, { label: "Node Type", required: true, allowedValues: ["Concept", "Project"] }) ||
            !validateField(updatedNode.Status, { label: "Status", required: true, allowedValues: ["Exploring", "Learning", "Mastered"] }) ||
            !validateField(updatedNode.ConfidenceLevel, { label: "Confidence", required: true, minValue: 1, maxValue: 10 }) ||
            !validateField(updatedNode.DomainId, { label: "Domain", required: true, minValue: 1 })
        ) {
            console.error("❌ One or more validation checks failed.");
            return;
        }


        const success = await updateAKnowledgeNode(updatedNode);

        if (success) {
            alert("✅ Knowledge Node updated!");
            window.location.href = "/html/kn/knowledge-nodes-main.html";
        } else {
            alert("❌ Failed to update Knowledge Node.");
        }
    });

    const backBtn = document.getElementById("back-button");
    backBtn?.addEventListener("click", () => {
        window.history.back();
    });
});

function getNodeIdFromUrl(): number | null 
{
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? parseInt(id) : null;
}

function populateDomainSelect(domains: any[], selectedId: number) 
{
    const select = document.getElementById("domain") as HTMLSelectElement;
    domains.forEach(domain => {
        const option = document.createElement("option");
        option.value = domain.DomainId;
        option.textContent = domain.DomainName;
        if (domain.DomainId === selectedId) option.selected = true;
        select.appendChild(option);
    });
}

function populateConfidenceSelect(current: number) 
{
    const select = document.getElementById("confidence") as HTMLSelectElement;
    for (let i = 1; i <= 10; i++) {
        const option = document.createElement("option");
        option.value = i.toString();
        option.textContent = i.toString();
        if (i === current) option.selected = true;
        select.appendChild(option);
    }
}

function prefillForm(node: KnowledgeNode) 
{
    (document.getElementById("title") as HTMLInputElement).value = node.Title;
    (document.getElementById("description") as HTMLTextAreaElement).value = node.Description;

    const typeRadio = document.querySelector(`input[name="nodeType"][value="${node.NodeType}"]`) as HTMLInputElement;
    if (typeRadio) typeRadio.checked = true;

    const statusRadio = document.querySelector(`input[name="status"][value="${node.Status}"]`) as HTMLInputElement;
    if (statusRadio) statusRadio.checked = true;
}
