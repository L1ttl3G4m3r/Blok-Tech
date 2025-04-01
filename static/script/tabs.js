document.addEventListener('DOMContentLoaded', () => {
  function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    // Functie om een tab actief te maken
    const activateTab = (tab) => {
        // Reset alle tabs
        tabs.forEach(t => {
            t.classList.remove('active');
            t.querySelector('.icon-normal')?.classList.remove('hidden'); // Controleer of element bestaat
            t.querySelector('.icon-selected')?.classList.add('hidden'); // Controleer of element bestaat
            t.querySelector('h2')?.classList.remove('selected'); // Reset h2-stijl
        });

        // Activeer geklikte tab
        tab.classList.add('active');
        tab.querySelector('.icon-normal')?.classList.add('hidden'); // Controleer of element bestaat
        tab.querySelector('.icon-selected')?.classList.remove('hidden'); // Controleer of element bestaat
        tab.querySelector('h2')?.classList.add('selected'); // Voeg geselecteerde stijl toe aan h2

        // Toon bijbehorende content en verberg andere content
        const targetId = tab.dataset.tab;
        contents.forEach(content => {
            if (content.id === targetId) {
                content.classList.remove('hidden'); // Toon geselecteerde content
            } else {
                content.classList.add('hidden'); // Verberg andere content
            }
        });
    };

    // Initialisatie: Maak "Collecties"-tab actief bij het laden van de pagina
    const initialTab = document.querySelector('.tab[data-tab="collections"]'); // Selecteer de "Collecties"-tab
    if (initialTab) {
        activateTab(initialTab); // Activeer deze tab en toon bijbehorende content
    }

    // Klikfunctionaliteit voor tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activateTab(tab);
        });
    });
  }

  // Roep de functie aan om tabs te initialiseren zodra de DOM geladen is
  initializeTabs();
});
