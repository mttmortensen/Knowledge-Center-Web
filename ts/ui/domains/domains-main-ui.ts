document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    const viewBtn = document.getElementById("view-domains");
    const crtBtn = document.getElementById("create-domain");

    if (viewBtn && crtBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            window.location.href = "/domains/domains-list.html"
        })

        crtBtn.addEventListener("click", async () => 
        {
            window.location.href = "/domains/domains-create.html"
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