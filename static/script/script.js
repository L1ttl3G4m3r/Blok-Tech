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
  };

  // Navigatie actief maken
  elements.navItems.forEach(item => {
      if (item.href === window.location.href) {
          item.parentElement.classList.add("active");
      }
  });

  elements.tattooGridImages.forEach((img, index) => {
    img.addEventListener('click', function() {
        window.location.href = `/detail/${index}`;
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
      elements.studioName.disabled = false;
      elements.studioAddres.disabled = false;
  });

  elements.form?.addEventListener('submit', function(event) {
      event.preventDefault();
      // Hier komt de logica voor het verwerken van het formulier
      console.log('Formulier verzonden');
  });
});

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
        alert('Image added to your collection!');
      } else {
        alert('Failed to add image.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    }
  });
});
