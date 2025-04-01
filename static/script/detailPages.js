document.addEventListener('DOMContentLoaded', function() {
  // Elementen selecteren
  const elements = {
      tattooGridImages: document.querySelectorAll('#tattoo-grid img'),
      carouselLinks: document.querySelectorAll('.carousel-link'), // Let op: we selecteren nu <a>
      selectedImage: document.getElementById("selectedImage"),
      imageTitle: document.getElementById("imageTitle")
  };

  // Functie om door te sturen naar de detailpagina
  function redirectToDetailPage(imgUrl, imgTitle) {
      const encodedUrl = encodeURIComponent(imgUrl);
      const encodedTitle = encodeURIComponent(imgTitle || "Geen titel");
      window.location.href = `/detailpagina?img=${encodedUrl}&titel=${encodedTitle}`;
  }

  // Klikfunctionaliteit op afbeeldingen in tattoo-grid
  elements.tattooGridImages.forEach((img) => {
      img.addEventListener('click', function() {
          redirectToDetailPage(img.src, img.alt);
      });
  });

  // Klikfunctionaliteit op afbeeldingen in de carousel (vervangt de standaard <a> werking)
  elements.carouselLinks.forEach((link) => {
      link.addEventListener('click', function(event) {
          event.preventDefault(); // Stop de standaard <a>-navigatie
          const imgUrl = link.getAttribute("data-url");
          const imgTitle = link.getAttribute("data-title");
          redirectToDetailPage(imgUrl, imgTitle);
      });
  });

  // Detailpagina: afbeelding en titel ophalen uit de URL
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
