document.addEventListener('DOMContentLoaded', function () {
  console.log("JavaScript loaded!"); // Debugging om te zien of het werkt

  // ✅ STAP 1: Klikfunctionaliteit voor afbeeldingen in index.ejs
  const tattooGridImages = document.querySelectorAll('#tattoo-grid img');
  if (tattooGridImages.length > 0) {
      tattooGridImages.forEach((img) => {
          img.addEventListener('click', function () {
              const imgUrl = encodeURIComponent(img.src);
              const imgTitle = encodeURIComponent(img.alt || "Geen titel");
              window.location.href = `/detailpagina?img=${imgUrl}&titel=${imgTitle}`;
          });
      });
  }

  // ✅ STAP 2: Klikfunctionaliteit voor afbeeldingen in selfmadeDetail.ejs (database posts)
  const selfmadeImages = document.querySelectorAll('.selfmade-img'); // Assuming class for images in selfmade detail
  if (selfmadeImages.length > 0) {
      selfmadeImages.forEach((img) => {
          img.addEventListener('click', function () {
              const imgUrl = encodeURIComponent(img.src);
              const imgTitle = encodeURIComponent(img.alt || "Geen titel");
              window.location.href = `/detailpagina?img=${imgUrl}&titel=${imgTitle}`;
          });
      });
  }

  // ✅ STAP 3: Klikfunctionaliteit voor normale carouselafbeeldingen (stuurt naar detailpagina)
  const carouselImages = document.querySelectorAll('.carousel-image'); // Alleen normale afbeeldingen in de carousel
  if (carouselImages.length > 0) {
      carouselImages.forEach((img) => {
          img.addEventListener('click', function (event) {
              event.preventDefault();
              const imgUrl = encodeURIComponent(img.getAttribute("src"));
              const imgTitle = encodeURIComponent(img.getAttribute("alt"));
              window.location.href = `/carouselDetail?category=${category}/detailpagina?img=${imgUrl}&titel=${imgTitle}`;
          });
      });
  }

  // ✅ STAP 4: Klikfunctionaliteit voor carouselitems met categorieën (stuurt naar carouselDetail)
  const carouselItems = document.querySelectorAll('.carousel-item');
  if (carouselItems.length > 0) {
      carouselItems.forEach((item) => {
          item.addEventListener('click', function () {
              const category = encodeURIComponent(item.getAttribute('data-category') || "uncategorized");
              window.location.href = `/carouselDetail?category=${category}`;
          });
      });
  }

  // ✅ STAP 5: Laad de juiste afbeelding en titel in op de detailpagina
  const selectedImage = document.getElementById("selectedImage");
  const imageTitle = document.getElementById("imageTitle");

  const params = new URLSearchParams(window.location.search);
  const imageUrl = params.get("img");
  const imageTitleText = params.get("titel");

  if (imageUrl && selectedImage) {
      selectedImage.src = decodeURIComponent(imageUrl);
  }

  if (imageTitleText && imageTitle) {
      imageTitle.textContent = decodeURIComponent(imageTitleText);
  }
});
