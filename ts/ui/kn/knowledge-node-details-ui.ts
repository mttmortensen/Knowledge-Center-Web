document.addEventListener("DOMContentLoaded", () => 
{
    // === Back button for KN List Page ===
    const backBtn = document.getElementById("back-button");
    if(backBtn)
    {
        backBtn.addEventListener("click", () => 
        {
            window.location.href = "knowledge-nodes-list.html";
        });
    }
});