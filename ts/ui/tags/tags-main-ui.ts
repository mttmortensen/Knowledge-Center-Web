document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    const viewBtn = document.getElementById("view-tags");
    const crtBtn = document.getElementById("create-tag");
    
    if (viewBtn && crtBtn ) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            window.location.href = "/tags/tags-list.html"
        })

        crtBtn.addEventListener("click", async () => 
        {
            window.location.href = "/tags/tags-create.html"
        });
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