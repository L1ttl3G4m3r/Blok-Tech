document.addEventListener('DOMContentLoaded', () => {
  const backgroundContainer = document.getElementById('backgroundContainer');
  const allImages = window.imageUrls; // Gebruik de globale variabele

  function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  function createImageColumns() {
      const columnCount = window.innerWidth <= 768 ? 2 : 7;
      backgroundContainer.innerHTML = '';

      for (let i = 0; i < columnCount; i++) {
          const column = document.createElement('div');
          column.className = 'image-column';
          backgroundContainer.appendChild(column);
      }
  }

  function setImageHeight(image) {
      const img = new Image();
      img.onload = function() {
          const aspectRatio = this.height / this.width;
          image.style.paddingBottom = `${aspectRatio * 100}%`;
      }
      img.src = image.style.backgroundImage.replace(/url\(['"]?(.+?)['"]?\)/, '$1');
  }

  function fillColumns() {
      const columns = document.querySelectorAll('.image-column');
      shuffleArray(allImages);

      columns.forEach((column, columnIndex) => {
          column.innerHTML = '';
          for (let i = 0; i < 5; i++) {
              const imageIndex = (columnIndex * 5 + i) % allImages.length;
              const newImage = document.createElement('div');
              newImage.className = 'background-image';
              newImage.style.backgroundImage = `url('${allImages[imageIndex].url}')`;
              column.appendChild(newImage);
              setImageHeight(newImage);
          }
      });
  }

  function initializeBackground() {
      createImageColumns();
      fillColumns();
  }

  initializeBackground();
  setInterval(fillColumns, 30000); // Vul opnieuw elke 30 seconden

  window.addEventListener('resize', initializeBackground);
});
