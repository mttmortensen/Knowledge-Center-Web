export function displayError(container: HTMLElement, message: string): void {
  container.innerHTML = "";

  const p = document.createElement("p");
  p.style.color = "red";
  p.textContent = message;
  container.appendChild(p);
}
