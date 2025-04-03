document.addEventListener('DOMContentLoaded', function () {
  console.log("JavaScript loaded!");

  const tattooGridImages = document.querySelectorAll('#tattoo-grid img');
  if (tattooGridImages.length > 0) {
      tattooGridImages.forEach((img) => {
          img.addEventListener('click', function () {
              const imgUrl = encodeURIComponent(img.src);
              const imgTitle = encodeURIComponent(img.alt || "Geen titel");
              window.location.href = `/detailpage?img=${imgUrl}&titel=${imgTitle}`;
          });
      });
  }

  const selfmadeImages = document.querySelectorAll('.selfmade-img');
  if (selfmadeImages.length > 0) {
      selfmadeImages.forEach((img) => {
          img.addEventListener('click', function () {
              const imgUrl = encodeURIComponent(img.src);
              const imgTitle = encodeURIComponent(img.alt || "Geen titel");
              window.location.href = `/detailpage?img=${imgUrl}&titel=${imgTitle}`;
          });
      });
  }

  const carouselImages = document.querySelectorAll('.carousel-image');
  if (carouselImages.length > 0) {
      carouselImages.forEach((img) => {
          img.addEventListener('click', function (event) {
              event.preventDefault();
              const imgUrl = encodeURIComponent(img.getAttribute("src"));
              const imgTitle = encodeURIComponent(img.getAttribute("alt"));
              window.location.href = `/carouselDetail?category=${category}/detailpage?img=${imgUrl}&titel=${imgTitle}`;
          });
      });
  }

  const carouselItems = document.querySelectorAll('.carousel-item');
  if (carouselItems.length > 0) {
      carouselItems.forEach((item) => {
          item.addEventListener('click', function () {
              const category = encodeURIComponent(item.getAttribute('data-category') || "uncategorized");
              window.location.href = `/carouselDetail?category=${category}`;
          });
      });
  }

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
