import { createKnowledgeNode } from "../../services/knowledge-node-service.js";
import { getAllDomains } from "../../services/domain-services.js";
import { requireAuth } from "../../services/auth-check.js";
import { validateField } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    populateConfidenceSelect("confidence");
    populateDomainSelect("domain");

    const form = document.getElementById("kn-form") as HTMLFormElement;

    if (form) {
        form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const Title = formData.get("title") as string;
        const DomainId = parseInt(formData.get("domain") as string);
        const NodeType = formData.get("nodeType") as string;
        const Description = formData.get("description") as string;
        const ConfidenceLevel = parseInt(formData.get("confidence") as string);
        const Status = formData.get("status") as string;
        
        // === ✅ Validation ===
        if 
        (
            !validateField(Title, { label: "Title", required: true, minLength: 3, maxLength: 100 }) ||
            !validateField(Description, { label: "Description", required: true, minLength: 10, maxLength: 500 }) ||
            !validateField(NodeType, { label: "Node Type", required: true, allowedValues: ["Concept", "Project"] }) ||
            !validateField(Status, { label: "Status", required: true, allowedValues: ["Active", "Paused"] }) ||
            !validateField(ConfidenceLevel, { label: "Confidence", required: true, minValue: 1, maxValue: 10 }) ||
            !validateField(DomainId, { label: "Domain", required: true, minValue: 1 })
        ) 
        {
            console.error("❌ One or more validation checks failed.");
            return;
        }

        const now = new Date().toISOString();

        const newNode = {
            Title,
            Description,
            ConfidenceLevel,
            Status,
            CreatedAt: now,
            LastUpdated: now,
            NodeType,
            DomainId
        };

        const success = await createKnowledgeNode(newNode);

        if (success) {
            alert("✅ Knowledge Node created!");
            window.location.href = "knowledge-nodes-main.html";
        } else {
            alert("❌ Failed to create Knowledge Node.");
        }
        });
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

function populateConfidenceSelect(selectId: string): void {
  const select = document.getElementById(selectId) as HTMLSelectElement;
  if (!select) return;

  for (let i = 1; i <= 10; i++) {
    const option = document.createElement("option");
    option.value = i.toString();
    option.textContent = i.toString();
    select.appendChild(option);
  }
}

async function populateDomainSelect(selectId: string): Promise<void> 
{
    const select = document.getElementById(selectId) as HTMLSelectElement;
    if(!select) return;

    try 
    {
        const domains = await getAllDomains();

        domains.forEach(domain => 
        {
            const option = document.createElement("option");
            option.value = domain.DomainId.toString();
            option.textContent = domain.DomainName;
            select.appendChild(option);
        })
    }
    catch (err) 
    {
        console.error("Failed to load domains:", err);
        const option = document.createElement("option");
        option.disabled = true;
        option.textContent = "Error Loading Domains";
        select.appendChild(option);
    }
}
