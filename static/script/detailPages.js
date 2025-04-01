document.addEventListener('DOMContentLoaded', function() {
  // Element selecties voor detailpagina
  const elements = {
      tattooGridImages: document.querySelectorAll('#tattoo-grid img'),
      selectedImage: document.getElementById("selectedImage"),
      imageTitle: document.getElementById("imageTitle")
  };

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
});
