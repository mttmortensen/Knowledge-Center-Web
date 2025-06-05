document.addEventListener("DOMContentLoaded", () => 
{
    // === Logs Menu Button Logic ===
    const viewBtn = document.getElementById("view-logs");

    if (viewBtn) 
    {
        viewBtn.addEventListener("click", async () => 
        {
            window.location.href = "/logs/logs-list.html"
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