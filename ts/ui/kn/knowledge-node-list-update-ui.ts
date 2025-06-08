import { getAllKnowledgeNodes } from "../../services/knowledge-node-service.js";

document.addEventListener("DOMContentLoaded", async () => 
{
     const knListDiv = document.getElementById("kn-list");
    const form = document.getElementById("kn-update-form") as HTMLFormElement;

    try 
    {
        const nodes = await getAllKnowledgeNodes();

        if (nodes.length === 0) {
            knListDiv!.innerHTML = "<p>No Knowledge Nodes found.</p>";
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
        knListDiv!.innerHTML = "<p>Failed to load Knowledge Nodes.</p>";
        console.error("Error fetching nodes:", err);
    }


    form.addEventListener("submit", (e) => 
    {
        e.preventDefault();
        const selected = (document.querySelector("input[name='kn']:checked") as HTMLInputElement);

        if (!selected) {
            alert("Please select a Knowledge Node to edit.");
            return;
        }

        // Store ID in localStorage for next page
        localStorage.setItem("editKNId", selected.value);
        window.location.href = "/kn/knowledge-nodes-update-details.html";
    });

    // === Back button ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }
})