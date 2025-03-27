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
      passwordInput: document.getElementById('password')
  };

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
