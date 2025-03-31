document.addEventListener('DOMContentLoaded', function () {
  // Alle DOM-elementen gecentraliseerd in één object
  const elements = {
      navItems: document.querySelectorAll(".nav-item a"),
      tattooGridImages: document.querySelectorAll('#tattoo-grid img'),
      studioAddress: document.getElementById('studioAddres'),
      tabs: document.querySelectorAll('.tab'),
      contents: document.querySelectorAll('.content'),
      profilePhotos: document.querySelectorAll('.profile-photo-container'),
      photoOptionsMenu: document.getElementById('photoOptionsMenu'),
      closePhotoMenu: document.getElementById('closePhotoMenu'),
      form: document.getElementById('updateProfileForm'),
      editButton: document.getElementById('editButton'),
      saveButton: document.getElementById('saveButton'),
      usernameInput: document.getElementById('username'),
      emailInput: document.getElementById('email'),
      passwordInput: document.getElementById('password'),
      studioName: document.getElementById('studioname')
  };

  // Functie om een tab actief te maken
  const activateTab = (tab) => {
      // Reset alle tabs
      elements.tabs.forEach(t => {
          t.classList.remove('active');
          t.querySelector('.icon-normal').classList.remove('hidden');
          t.querySelector('.icon-selected').classList.add('hidden');
          t.querySelector('h2').classList.remove('selected'); // Reset h2-stijl
      });

      // Activeer geklikte tab
      tab.classList.add('active');
      tab.querySelector('.icon-normal').classList.add('hidden');
      tab.querySelector('.icon-selected').classList.remove('hidden');
      tab.querySelector('h2').classList.add('selected'); // Voeg geselecteerde stijl toe aan h2

      // Toon bijbehorende content en verberg andere content
      const targetId = tab.dataset.tab;
      elements.contents.forEach(content => {
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
  elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          activateTab(tab);
      });
  });


  // Activeer huidige navigatie-item
  elements.navItems.forEach(item => {
      if (item.href === window.location.href) {
          item.parentElement.classList.add("active");
      }
  });

  // Tattoo grid klikfunctionaliteit
  elements.tattooGridImages.forEach((img, index) => {
      img.addEventListener('click', () => {
          window.location.href = `/detail/${index}`;
      });
  });

  // Profielfoto menu
  elements.profilePhotos.forEach(photo => {
      photo.addEventListener('click', () => {
          elements.photoOptionsMenu.style.display = 'flex';
      });
  });

  elements.closePhotoMenu?.addEventListener('click', () => {
      elements.photoOptionsMenu.style.display = 'none';
  });

  // Profielbewerkingsformulier
  elements.editButton?.addEventListener('click', () => {
      const fields = [
          elements.usernameInput,
          elements.emailInput,
          elements.passwordInput,
          elements.studioName,
          elements.studioAddress
      ];

      fields.forEach(field => field.disabled = false);
      elements.saveButton.disabled = false;
  });

  elements.form?.addEventListener('submit', function (e) {
      e.preventDefault();
      console.log('Formulier succesvol verzonden');
  });
});
