import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";
import { requireAuth } from "../../services/auth-check.js";
import { displayError } from "../../services/ui-utils.js";

requireAuth();

document.addEventListener("DOMContentLoaded", async () => 
{
    const knListDiv = document.getElementById("kn-list") as HTMLElement;
    const form = document.getElementById("kn-update-form") as HTMLFormElement;

    try 
    {
        const nodes = await getAllKnowledgeNodes();

        if (nodes.length === 0) {
            displayError(knListDiv, "No Knowledge Nodes found.");
            return;
        }

        nodes.forEach(KnowledgeNode => {
            const wrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "kn";
            radio.value = KnowledgeNode.Id.toString();
            radio.id = `kn-${KnowledgeNode.Id}`;

            const label = document.createElement("label");
            label.htmlFor = radio.id;
            label.textContent = `${KnowledgeNode.Title}`;

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


    form.addEventListener("submit", (e) => 
    {
        e.preventDefault();
        const selected = document.querySelector("input[name='kn']:checked") as HTMLInputElement;

        if (!selected) {
            alert("Please select a Knowledge Node to edit.");
            return;
        }

        const nodeId = selected.value;
        window.location.href = `/html/kn/knowledge-nodes-details-update.html?id=${nodeId}`;
    });
})