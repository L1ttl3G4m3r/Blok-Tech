document.addEventListener('DOMContentLoaded', () => {
  const backgroundContainer = document.getElementById('backgroundContainer');
  const allImages = window.imageUrls;
  const tattooGridImages = document.querySelectorAll('#tattoo-grid img');

  tattooGridImages.forEach((img, index) => {
      img.addEventListener('click', () => {
          window.location.href = `/detail/${index}`;
      });
  });

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

  function addImagesToColumns() {
      const columns = document.querySelectorAll('.image-column');
      shuffleArray(allImages);

      columns.forEach((column, columnIndex) => {
          for (let i = 0; i < 5; i++) {
              const imageIndex = (columnIndex * 5 + i) % allImages.length;
              const imgElement = document.createElement('img');
              imgElement.className = 'background-image';
              imgElement.src = allImages[imageIndex].url;
              imgElement.loading = 'lazy';
              imgElement.alt = 'Tattoo image';
              column.appendChild(imgElement);
          }
      });

      observeLastRow();
  }

  function observeLastRow() {
      const lastImages = document.querySelectorAll('.image-column img:last-child');
      if (lastImages.length === 0) return;

      const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
              if (entry.isIntersecting) {
                  addImagesToColumns();
              }
          });
      }, {
          root: null,
          threshold: 0.01
      });

      lastImages.forEach(img => observer.observe(img));
  }

  function initializeBackground() {
      createImageColumns();
      addImagesToColumns();
  }

  initializeBackground();
  window.addEventListener('resize', initializeBackground);
});
