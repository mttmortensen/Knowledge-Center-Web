import { createLog } from "../../services/log-services.js";
import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";
import { getAllTags } from "../../services/tag-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { validateField } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", () => 
{
    populateNodeSelect("nodeId");
    populateTagSelect("tagId");

    const form = document.getElementById("log-form") as HTMLFormElement;

    if (form) 
    {
        form.addEventListener("submit", async (e) => 
        {
            e.preventDefault();
            const formData = new FormData(form);

            const NodeId = parseInt(formData.get("nodeId") as string);
            const Content = formData.get("content") as string;
            const TagId = parseInt(formData.get("tagId") as string);
            const ContributesToProgress = formData.get("contributesToProgress") === "true";
            
            // === ✅ Validation ===
            if 
            (
                !validateField(Content, { label: "Content", required: true, minLength: 3, maxLength: 2000 }) ||
                !validateField(ContributesToProgress, { label: "Contribute to Progress", required: true,})
            ) 
            {
                console.error("❌ One or more validation checks failed.");
                return;
            }

            const newLog = 
            {
                NodeId,
                Content,
                TagId,
                ContributesToProgress
            }

            const success = await createLog(newLog);

            if(success) 
            {
                alert("✅ Log created!");
                window.location.href = "/html/logs/logs-main.html";            
            }
            else 
            {
                alert("❌ Failed to create log.");

            }
        });
    }
})

async function populateNodeSelect(selectId: string): Promise<void> {
  const select = document.getElementById(selectId) as HTMLSelectElement;
  if (!select) return;

  try {
    const nodes = await getAllKnowledgeNodes();

    nodes.forEach((node: any) => {
      const option = document.createElement("option");
      option.value = node.Id.toString();
      option.textContent = node.Title;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load Knowledge Nodes:", err);
    const option = document.createElement("option");
    option.disabled = true;
    option.textContent = "Error loading Knowledge Nodes";
    select.appendChild(option);
  }
}

async function populateTagSelect(selectId: string): Promise<void> {
  const select = document.getElementById(selectId) as HTMLSelectElement;
  if (!select) return;

  try {
    const tags = await getAllTags();

    tags.forEach((tag: any) => {
      const option = document.createElement("option");
      option.value = tag.TagId.toString();
      option.textContent = tag.Name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("❌ Failed to load Tags:", err);
    const option = document.createElement("option");
    option.disabled = true;
    option.textContent = "Error loading Tags";
    select.appendChild(option);
  }
}
