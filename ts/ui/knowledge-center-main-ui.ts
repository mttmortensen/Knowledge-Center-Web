import { requireAuth } from "../services/auth-check.js";

requireAuth();

document.getElementById("quick-log")?.addEventListener("click", () => {
  window.location.href= "/logs/logs-create.html"
})

document.getElementById("quick-create-node")?.addEventListener("click", () => {
  window.location.href = "/kn/knowledge-nodes-create.html"
})

document.getElementById("menu-nodes")?.addEventListener("click", () => {
  window.location.href = "/kn/knowledge-nodes-main.html";
});

document.getElementById("menu-domains")?.addEventListener("click", () => {
  window.location.href = "/domains/domains-main.html";
});

document.getElementById("menu-logs")?.addEventListener("click", () => {
  window.location.href = "/logs/logs-main.html";
});

document.getElementById("menu-tags")?.addEventListener("click", () => {
  window.location.href = "/tags/tags-main.html";
});