document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    setupNav("view-nodes", "/kn/knowledge-nodes-list.html");
    setupNav("create-node", "/kn/knowledge-nodes-create.html");
    setupNav("update-node", "/kn/knowledge-nodes-list-update.html");

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

// This allows me to avoid repeating the same setup of code for each button 
// And avoiding a nested conditional hell. 
function setupNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId);
    if (btn) 
    {
        btn.addEventListener("click", () => {
            window.location.href = targetUrl;
        });
    }
}


