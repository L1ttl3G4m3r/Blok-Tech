document.addEventListener('DOMContentLoaded', function() {
    const filterButton = document.getElementById('filterButton');
    const filterMenu = document.getElementById('filterMenu');

    // Toggle het menu wanneer op de knop wordt geklikt
    filterButton.addEventListener('click', function(event) {
        event.stopPropagation(); // Voorkom dat het sluiten van buitenaf meteen gebeurt
        filterMenu.classList.toggle('hidden');
    });

     // Sluit het menu als er buiten wordt geklikt
    document.addEventListener('click', function(event) {
        if (!filterMenu.contains(event.target)) {
            filterMenu.classList.add('hidden');
        }
    });
});