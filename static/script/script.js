document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sort-select');
  const filterButton = document.getElementById('filterButton');
  const filterSidebar = document.getElementById('filterSidebar');
  const closeButton = document.getElementById('closeSidebar');
  const applyFiltersButton = document.getElementById('applyFiltersButton');
  const clearStylesButton = document.getElementById('clearStyles');
  const clearColorsButton = document.getElementById('clearColors');
  const navItems = document.querySelectorAll(".nav-item a");
  document.getElementById('sort-select').addEventListener('change', function() {
    document.getElementById('sort-form').submit();
  });

  // Sorteren functionaliteit
  sortSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    window.location.href = `/?sort_by=${selectedValue}`;
  });

  // Filter Sidebar functionaliteit
  filterButton.addEventListener('click', () => {
    if (filterSidebar.style.width === '340px') {
      filterSidebar.style.width = '0';
    } else {
      filterSidebar.style.width = '340px';
    }
  });

  closeButton.addEventListener('click', () => {
    filterSidebar.style.width = '0';
  });

  // Clear filters functionaliteit
  clearStylesButton.addEventListener('click', function() {
    document.querySelectorAll('input[name="styles"]').forEach(checkbox => {
      checkbox.checked = false;
    });
  });


  clearColorsButton.addEventListener('click', function() {
    document.querySelectorAll('input[name="colors"]').forEach(radio => {
      radio.checked = false;
    });
  });

  // Apply filters functionaliteit
  applyFiltersButton.addEventListener('click', function(event) {
    event.preventDefault();

    const selectedStyles = Array.from(document.querySelectorAll('input[name="styles"]:checked'))
      .map(checkbox => checkbox.value);
    const selectedColor = document.querySelector('input[name="colors"]:checked')?.value || '';

    let url = '/?';
    if (sortSelect.value !== 'relevant') {
      url += 'sort_by=' + sortSelect.value + '&';
    }
    if (selectedStyles.length > 0) {
      url += 'styles=' + selectedStyles.join(',') + '&';
    }
    if (selectedColor) {
      url += 'colors=' + selectedColor + '&';
    }

    if (url.endsWith('&')) {
      url = url.slice(0, -1);
    }

    window.location.href = url;
  });
});

document.addEventListener("DOMContentLoaded", function () {
    const navItems = document.querySelectorAll(".nav-item a");

    navItems.forEach(item => {
        if (item.href === window.location.href) {
            item.parentElement.classList.add("active");
        }
    });
});
// Tattoo grid startpagina //
document.querySelectorAll('#tattoo-grid img').forEach(img => {
  img.addEventListener('click', function() {
    window.location.href = `/detailpagina/${this.dataset.id}`;
  });
});

window.imageUrls = JSON.parse(
  decodeURIComponent(
    document.getElementById("imageUrlsContainer").dataset.imageUrls
  )
);
