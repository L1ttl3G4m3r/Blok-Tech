
const filterButton = document.getElementById('filterButton');
const filterSidebar = document.getElementById('filterSidebar');
const closeButton = document.getElementById('closeSidebar');

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

document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sort-select');
  const filterButton = document.getElementById('filterButton');
  const filterSidebar = document.getElementById('filterSidebar');
  const closeButton = document.getElementById('closeSidebar');
  const applyFiltersButton = document.getElementById('applyFiltersButton');
  const clearStylesButton = document.getElementById('clearStyles');
  const clearColorsButton = document.getElementById('clearColors');

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