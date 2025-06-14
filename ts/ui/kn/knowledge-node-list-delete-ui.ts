import { getAllKnowledgeNodes, deleteAKnowledgeNode } from "../../services/knowledge-node-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const knListDiv = document.getElementById("kn-list") as HTMLElement;
    const form = document.getElementById("kn-delete-form") as HTMLFormElement;

    try 
    {
        const nodes = await getAllKnowledgeNodes();

        if (nodes.length === 0) {
            displayError(knListDiv, "No Knowledge Nodes found to Delete.");
            return;
        }

        nodes.forEach(node => {
            const wrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "kn";
            radio.value = node.Id.toString();
            radio.id = `kn-${node.Id}`;

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.textContent = `${node.Title}`;

            wrapper.appendChild(radio);
            wrapper.appendChild(label);

            knListDiv!.appendChild(wrapper);
        });
    } 
    catch (err) 
    {
        displayError(knListDiv, "Failed to load Knowledge Nodes.");
        console.error("Error fetching nodes:", err);
    }

    form.addEventListener("submit", async (e) => 
    {
        e.preventDefault();
        const selected = document.querySelector("input[name='kn']:checked") as HTMLInputElement;

        if (!selected) {
            alert("Please select a Knowledge Node to delete.");
            return;
        }

        const nodeId = parseInt(selected.value);

        const confirmed = confirm("Are you sure you want to delete this Knowledge Node? This cannot be undone.");
        if (!confirmed) return;

        const success = await deleteAKnowledgeNode(nodeId);

        if (success) {
            alert("✅ Knowledge Node deleted!");
            window.location.reload();
        } else {
            alert("❌ Failed to delete Knowledge Node.");
        }
    });
});
