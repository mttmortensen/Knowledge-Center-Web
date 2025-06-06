document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    const viewBtn = document.getElementById("view-nodes");
    const crtBtn = document.getElementById("create-node");

    if (viewBtn && crtBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            window.location.href = "/kn/knowledge-nodes-list.html"
        })

        crtBtn.addEventListener("click", async () => 
        {
            window.location.href = "/kn/knowledge-nodes-create.html"
        })

    }

    // === Back button for Main Menu ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.history.back();
        });
    }
    
})

