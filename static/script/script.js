document.addEventListener('DOMContentLoaded', function() {
  // Element selecties
  const elements = {
      sortSelect: document.getElementById('sort-select'),
      filterButton: document.getElementById('filterButton'),
      filterSidebar: document.getElementById('filterSidebar'),
      closeButton: document.getElementById('closeSidebar'),
      applyFiltersButton: document.getElementById('applyFiltersButton'),
      clearStylesButton: document.getElementById('clearStyles'),
      clearColorsButton: document.getElementById('clearColors'),
      navItems: document.querySelectorAll(".nav-item a"),
      tattooGridImages: document.querySelectorAll('#tattoo-grid img'),
      profilePhotos: document.querySelectorAll('.profile-photo-container'),
      photoOptionsMenu: document.getElementById('photoOptionsMenu'),
      closePhotoMenu: document.getElementById('closePhotoMenu'),
      form: document.getElementById('updateProfileForm'),
      editButton: document.getElementById('editButton'),
      saveButton: document.getElementById('saveButton'),
      usernameInput: document.getElementById('username'),
      emailInput: document.getElementById('email'),
      passwordInput: document.getElementById('password')

  };

  // Sorteren functionaliteit
  elements.sortSelect?.addEventListener('change', function() {
      window.location.href = `/?sort_by=${encodeURIComponent(this.value)}`;
  });

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
      const selectedStyles = getSelectedValues('styles');
      const selectedColor = document.querySelector('input[name="colors"]:checked')?.value || '';

      const searchParams = new URLSearchParams();
      if (elements.sortSelect.value !== 'relevant') {
          searchParams.append('sort_by', elements.sortSelect.value);
      }
      if (selectedStyles.length > 0) {
          searchParams.append('styles', selectedStyles.join(','));
      }
      if (selectedColor) {
          searchParams.append('colors', selectedColor);
      }

      window.location.href = `/?${searchParams.toString()}`;
  });

  function getSelectedValues(name) {
      return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
          .map(input => input.value);
  }

  // Navigatie actief maken
  elements.navItems.forEach(item => {
      if (item.href === window.location.href) {
          item.parentElement.classList.add("active");
      }
  });

  // Tattoo grid klikbaar maken
  elements.tattooGridImages.forEach(img => {
      img.addEventListener('click', function() {
          window.location.href = `/detailpagina/${encodeURIComponent(this.dataset.id)}`;
      });
  });

  // Profielfoto menu functionaliteit
  elements.profilePhotos.forEach(photo => {
      photo.addEventListener('click', function() {
          elements.photoOptionsMenu.style.display = 'flex';
      });
  });

  elements.closePhotoMenu?.addEventListener('click', function() {
      elements.photoOptionsMenu.style.display = 'none';
  });

  // Formulier functionaliteit
  elements.editButton?.addEventListener('click', function () {
      elements.usernameInput.disabled = false;
      elements.emailInput.disabled = false;
      elements.passwordInput.disabled = false;
      elements.saveButton.disabled = false;
  });

  elements.form?.addEventListener('submit', function(event) {
      event.preventDefault();
      // Hier komt de logica voor het verwerken van het formulier
      console.log('Formulier verzonden');
  });
});
