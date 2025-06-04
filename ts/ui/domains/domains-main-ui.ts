document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    const viewBtn = document.getElementById("view-domains");

    if (viewBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            window.location.href = "/domains/domains-list.html"
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