document.addEventListener('DOMContentLoaded', function() {
  const elements = {
    sortSelect: document.getElementById('sort-select'),
    filterButton: document.getElementById('filterButton'),
    filterSidebar: document.getElementById('filterSidebar'),
    closeButton: document.getElementById('closeSidebar'),
    applyFiltersButton: document.getElementById('applyFiltersButton'),
    clearStylesButton: document.getElementById('clearStyles'),
    clearColorsButton: document.getElementById('clearColors'),
  };

  // Filter Sidebar functionaliteit
  elements.filterButton?.addEventListener('click', (event) => {
    event.preventDefault();
    elements.filterSidebar.style.width = elements.filterSidebar.style.width === '340px' ? '0' : '340px';
  });

  elements.closeButton?.addEventListener('click', () => {
    elements.filterSidebar.style.width = '0';
  });

  // Clear filters functionaliteit
  elements.clearStylesButton?.addEventListener('click', () => clearCheckboxes('styles'));
  elements.clearColorsButton?.addEventListener('click', () => clearCheckboxes('colors'));

  function clearCheckboxes(name) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(input => {
      input.checked = false;
    });
  }

  // Apply filters functionaliteit
  elements.applyFiltersButton?.addEventListener('click', function(event) {
    event.preventDefault();
    applyFilters();
  });

  // Sorteren functionaliteit
  elements.sortSelect?.addEventListener('change', function() {
    applyFilters();
  });

  function applyFilters() {
    const selectedStyles = getSelectedValues('styles');
    const selectedColor = document.querySelector('input[name="colors"]:checked')?.value || '';
    const sortBy = elements.sortSelect?.value || 'relevant';

    const searchParams = new URLSearchParams(window.location.search);
    if (sortBy !== 'relevant') {
      searchParams.set('sort_by', sortBy);
    } else {
      searchParams.delete('sort_by');
    }
    if (selectedStyles.length > 0) {
      searchParams.set('styles', selectedStyles.join(','));
    } else {
      searchParams.delete('styles');
    }
    if (selectedColor) {
      searchParams.set('colors', selectedColor);
    } else {
      searchParams.delete('colors');
    }

    window.location.href = `/index?${searchParams.toString()}`;
  }

  function getSelectedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
      .map(input => input.value);
  }

  // Initialiseer filters op basis van URL parameters
  function initializeFilters() {
    const searchParams = new URLSearchParams(window.location.search);
    const styles = searchParams.get('styles')?.split(',') || [];
    const color = searchParams.get('colors');
    const sortBy = searchParams.get('sort_by');

    styles.forEach(style => {
      const checkbox = document.querySelector(`input[name="styles"][value="${style}"]`);
      if (checkbox) checkbox.checked = true;
    });

    if (color) {
      const radioButton = document.querySelector(`input[name="colors"][value="${color}"]`);
      if (radioButton) radioButton.checked = true;
    }

    if (sortBy && elements.sortSelect) {
      elements.sortSelect.value = sortBy;
    }
  }

  initializeFilters();
});
