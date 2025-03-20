
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
// code bron: perplexity.ai //
document.addEventListener('DOMContentLoaded', function() {
  const sortSelect = document.getElementById('sort-select');
  const resultDiv = document.getElementById('result');

  sortSelect.addEventListener('change', function() {
    const selectedOption = this.options[this.selectedIndex];
    const selectedValue = selectedOption.value;
    const selectedText = selectedOption.text;

    resultDiv.textContent = `Je hebt gekozen om te sorteren op: ${selectedText} (waarde: ${selectedValue})`;

    // Hier kun je de logica toevoegen om daadwerkelijk te sorteren
    // bijvoorbeeld:
    // sortItems(selectedValue);
  });
});

// Voorbeeld sorteerfunctie (niet geïmplementeerd)
function sortItems(sortMethod) {
  // Implementeer hier je sorteerlogica
  console.log(`Sorteren met methode: ${sortMethod}`);
}