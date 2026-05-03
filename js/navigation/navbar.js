document.addEventListener("DOMContentLoaded", () => {
  fetch("js/navigation/navbar.json")
    .then(res => res.json())
    .then(data => {
      const role = "consultation";
      const navContainer = document.getElementById("nav-links");

      let currentPage = window.location.pathname.split("/").pop();
      if (!currentPage) currentPage = "index.html";

      navContainer.innerHTML = data[role].map(link => {
        const isActive = link.href !== "#" && link.href === currentPage ? "active" : "";

        const icon = link.icon ? `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="${link.icon}"/>
          </svg>` : "";

        return `
          <a href="${link.href}" class="nav-item ${isActive}">
            ${icon}
            <span>${link.text}</span>
          </a>`;
      }).join("");
    })
    .catch(err => console.error("Failed to load nav.json:", err));
});