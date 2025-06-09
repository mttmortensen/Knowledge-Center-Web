document.addEventListener("DOMContentLoaded", () => 
{
    // === Main Menu Button Logic ===
    setupDomainNav("view-domains", "/domains/domains-list.html")
    setupDomainNav("create-domain", "/domains/domains-create.html")
    setupDomainNav("update-domain", "/domains/domains-list-update.html")
    setupDomainNav("delete-domain", "/domains/domains-list-delete.html")


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
function setupDomainNav(buttonId: string, targetUrl: string): void 
{
    const btn = document.getElementById(buttonId);
    if (btn) 
    {
        btn.addEventListener("click", () => {
            window.location.href = targetUrl;
        });
    }
}