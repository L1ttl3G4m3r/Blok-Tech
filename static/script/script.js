document.addEventListener('DOMContentLoaded', function() {
  // Element selecties
  const elements = {
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
      passwordInput: document.getElementById('password'),
      studioName: document.getElementById('studioname'),
      studioAddres: document.getElementById('studioAddres'),

      selectedImage: document.getElementById("selectedImage"),
      imageTitle: document.getElementById("imageTitle")
  };

  // Navigatie actief maken
  elements.navItems.forEach(item => {
      if (item.href === window.location.href) {
          item.parentElement.classList.add("active");
      }
  });

  // Klikfunctionaliteit op afbeeldingen in tattoo-grid
  elements.tattooGridImages.forEach((img) => {
      img.addEventListener('click', function() {
          const imgUrl = encodeURIComponent(img.src);
          const imgTitle = encodeURIComponent(img.alt || "Geen titel");

          // Ga naar de juiste detailpagina met de afbeelding als parameter
          window.location.href = `/detailpagina?img=${imgUrl}&titel=${imgTitle}`;
      });
  });

  // Afbeelding en titel in detailpagina tonen
  const params = new URLSearchParams(window.location.search);
  const imageUrl = params.get("img");
  const imageTitle = params.get("titel");

  if (imageUrl && elements.selectedImage) {
      elements.selectedImage.src = decodeURIComponent(imageUrl);
  }

  if (imageTitle && elements.imageTitle) {
      elements.imageTitle.textContent = decodeURIComponent(imageTitle);
  }

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
      elements.studioName.disabled = false;
      elements.studioAddres.disabled = false;
  });

  elements.form?.addEventListener('submit', function(event) {
      event.preventDefault();
      console.log('Formulier verzonden');
  });

  // Toevoegen aan collectie
  document.querySelectorAll('.add-to-collection').forEach(button => {
      button.addEventListener('click', async () => {
          const imageUrl = button.getAttribute('data-url');

          try {
              const response = await fetch('/add-to-collection', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ imageUrl })
              });

              if (response.ok) {
                  alert('Afbeelding toegevoegd aan je collectie!');
              } else {
                  alert('Mislukt om afbeelding toe te voegen.');
              }
          } catch (error) {
              console.error('Fout:', error);
              alert('Er is een fout opgetreden.');
          }
      });
  });
});
