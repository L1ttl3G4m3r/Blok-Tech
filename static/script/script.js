
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

  sortSelect.addEventListener('change', function() {
    const selectedValue = this.value;
    window.location.href = `/?sort_by=${selectedValue}`;
  });
});