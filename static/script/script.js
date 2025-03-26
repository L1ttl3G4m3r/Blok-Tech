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

        profilePhoto: document.querySelector('.profile-photo-container'),
        photoOptionsMenu: document.getElementById('photoOptionsMenu'),
        closePhotoMenu: document.getElementById('closePhotoMenu')
    };

    // Sorteren functionaliteit
    elements.sortSelect?.addEventListener('change', function() {
        window.location.href = `/?sort_by=${this.value}`;
    });

    // Filter Sidebar functionaliteit
    elements.filterButton?.addEventListener('click', () => {
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

        let url = '/?';
        if (elements.sortSelect.value !== 'relevant') {
            url += `sort_by=${elements.sortSelect.value}&`;
        }
        if (selectedStyles.length > 0) {
            url += `styles=${selectedStyles.join(',')}&`;
        }
        if (selectedColor) {
            url += `colors=${selectedColor}&`;
        }

        window.location.href = url.endsWith('&') ? url.slice(0, -1) : url;
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
            window.location.href = `/detailpagina/${this.dataset.id}`;
        });
    });

    // Profielfoto menu functionaliteit
    elements.profilePhoto?.addEventListener('click', function() {
        elements.photoOptionsMenu.style.display = 'flex';
    });

    elements.closePhotoMenu?.addEventListener('click', function() {
        elements.photoOptionsMenu.style.display = 'none';
    });
});
// perplexity //
const form = document.getElementById('updateProfileForm');
const editButton = document.getElementById('editButton');
const saveButton = document.getElementById('saveButton');

// Formuliervelden
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const PasswordInput = document.getElementById('Password');

// Activeer bewerken
editButton.addEventListener('click', function () {
    usernameInput.disabled = false;
    emailInput.disabled = false;
    PasswordInput.disabled = false;
    saveButton.disabled = false;
});
