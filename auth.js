document.addEventListener("DOMContentLoaded", function () {

  const storedUser = localStorage.getItem("xanaUser");

  // 🔐 Session check (like if_session in PHP)
  if (!storedUser) {
    window.location.href = "index.html";
    return;
  }

  const user = JSON.parse(storedUser);

  loadNavbar(user.role);
  loadDashboard(user);
});

function loadNavbar(role) {

  fetch("navbar.html")
    .then(response => response.text())
    .then(data => {

      document.getElementById("navbar-container").innerHTML = data;

      // Hide links that don't belong to this role
      document.querySelectorAll("[data-role]").forEach(item => {
        if (item.getAttribute("data-role") !== role) {
          item.style.display = "none";
        }
      });

    });
}

function loadDashboard(user) {

  document.getElementById("welcomeMessage").textContent =
    "Welcome " + user.username + " (" + user.role + ")";
}

function logout() {
  localStorage.removeItem("xanaUser");
  window.location.href = "index.html";
}
