import { createKnowledgeNode } from "../../services/knowledge-node-service.js";

document.addEventListener("DOMContentLoaded", () => 
{
    populateConfidenceSelect("confidence");
    const form = document.getElementById("kn-form") as HTMLFormElement;

    if (form) {
        form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const Title = formData.get("title") as string;
        const NodeType = formData.get("nodeType") as string;
        const Description = formData.get("description") as string;
        const ConfidenceLevel = parseInt(formData.get("confidence") as string);
        const Status = formData.get("status") as string;

        const now = new Date().toISOString();

        const newNode = {
            Title,
            NodeType,
            Description,
            ConfidenceLevel,
            Status,
            DomainId: 0, // Placeholder for now — we'll add domain support later
            CreatedAt: now,
            LastUpdated: now
        };

        console.log(newNode)

        // const success = await createKnowledgeNode(newNode);

        // if (success) {
        //     alert("✅ Knowledge Node created!");
        //     window.location.href = "knowledge-nodes-main.html";
        // } else {
        //     alert("❌ Failed to create Knowledge Node.");
        // }
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
