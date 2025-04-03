document.addEventListener('DOMContentLoaded', function () {
  const navItems = document.querySelectorAll(".nav-item a");

  navItems.forEach(item => {
      if (item.href === window.location.href) {
          item.parentElement.classList.add("active");
      }
  });
});
