import { requireAuth } from "../services/auth-check.js";

requireAuth();

document.getElementById("quick-log")?.addEventListener("click", () => {
  window.location.href= "/html/logs/logs-create.html"
})

document.getElementById("quick-create-node")?.addEventListener("click", () => {
  window.location.href = "/html/kn/knowledge-nodes-create.html"
})

document.getElementById("menu-nodes")?.addEventListener("click", () => {
  window.location.href = "/html/kn/knowledge-nodes-main.html";
});

document.getElementById("menu-domains")?.addEventListener("click", () => {
  window.location.href = "/html/domains/domains-main.html";
});

document.getElementById("menu-logs")?.addEventListener("click", () => {
  window.location.href = "/html/logs/logs-main.html";
});

document.getElementById("menu-tags")?.addEventListener("click", () => {
  window.location.href = "/html/tags/tags-main.html";
});