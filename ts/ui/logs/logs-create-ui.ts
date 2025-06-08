import { createLog } from "../../services/log-services";
import { getAllKnowledgeNodes } from "../../services/knowledge-node-service";
import { getAllTags } from "../../services/tag-service";

document.addEventListener("DOMContentLoaded", () => 
{
    // populateNodeSelect("nodeId");
    // populateTagSelect("tagId");

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
            const EntryDate = new Date().toISOString(); 

            
        })
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
    
})