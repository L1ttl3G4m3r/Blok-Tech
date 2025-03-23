document.addEventListener('DOMContentLoaded', function() {
  // Element selecties
  const sortSelect = document.getElementById('sort-select');
  const filterButton = document.getElementById('filterButton');
  const filterSidebar = document.getElementById('filterSidebar');
  const closeButton = document.getElementById('closeSidebar');
  const applyFiltersButton = document.getElementById('applyFiltersButton');
  const clearStylesButton = document.getElementById('clearStyles');
  const clearColorsButton = document.getElementById('clearColors');
  const navItems = document.querySelectorAll(".nav-item a");

  // Sorteren functionaliteit
  sortSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    window.location.href = `/?sort_by=${selectedValue}`;
  });

  // Filter Sidebar functionaliteit
  filterButton.addEventListener('click', toggleSidebar);
  closeButton.addEventListener('click', closeSidebar);

  // Clear filters functionaliteit
  clearStylesButton.addEventListener('click', clearStyles);
  clearColorsButton.addEventListener('click', clearColors);

  // Apply filters functionaliteit
  applyFiltersButton.addEventListener('click', applyFilters);

  // Navigatie actief item markeren
  markActiveNavItem();

  // Tattoo grid klikbaar maken
  makeTattooGridClickable();
});

// Functies
function toggleSidebar() {
  filterSidebar.style.width = filterSidebar.style.width === '340px' ? '0' : '340px';
}

function closeSidebar() {
  filterSidebar.style.width = '0';
}

function clearStyles() {
  document.querySelectorAll('input[name="styles"]').forEach(checkbox => {
    checkbox.checked = false;
  });
}

function clearColors() {
  document.querySelectorAll('input[name="colors"]').forEach(radio => {
    radio.checked = false;
  });
}

function applyFilters(event) {
  event.preventDefault();

  const selectedStyles = Array.from(document.querySelectorAll('input[name="styles"]:checked'))
    .map(checkbox => checkbox.value);
  const selectedColor = document.querySelector('input[name="colors"]:checked')?.value || '';

  let url = '/?';
  if (sortSelect.value !== 'relevant') {
    url += `sort_by=${sortSelect.value}&`;
  }
  if (selectedStyles.length > 0) {
    url += `styles=${selectedStyles.join(',')}&`;
  }
  if (selectedColor) {
    url += `colors=${selectedColor}&`;
  }

  window.location.href = url.endsWith('&') ? url.slice(0, -1) : url;
}

function markActiveNavItem() {
  const navItems = document.querySelectorAll(".nav-item a");
  navItems.forEach(item => {
    if (item.href === window.location.href) {
      item.parentElement.classList.add("active");
    }
  });
}

function makeTattooGridClickable() {
  document.querySelectorAll('#tattoo-grid img').forEach(img => {
    img.addEventListener('click', function() {
      window.location.href = `/detailpagina/${this.dataset.id}`;
    });
  });
}
