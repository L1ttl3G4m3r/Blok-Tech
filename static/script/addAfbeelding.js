document.addEventListener('DOMContentLoaded', function() {
  // Lees de imageUrls data uit het HTML-element
  const imageUrlsData = document.getElementById('imageUrlsData');
  if (imageUrlsData) {
      const serverImageUrls = JSON.parse(imageUrlsData.dataset.imageUrls);

      console.log('Received image URLs:', serverImageUrls);

      const container = document.getElementById('backgroundContainer');
      const imageUrls = serverImageUrls;
      let columns = window.innerWidth <= 768 ? 2 : 7;

      function createImageColumns() {
          container.innerHTML = '';
          for (let i = 0; i < columns; i++) {
              const column = document.createElement('div');
              column.className = 'image-column';
              container.appendChild(column);
          }
      }

      function fillColumns() {
          const columns = container.children;
          let columnIndex = 0;
          imageUrls.forEach(img => {
              const div = document.createElement('div');
              div.className = 'background-image';
              div.style.backgroundImage = `url(${img.url})`;
              const aspectRatio = img.height / img.width;
              div.style.paddingBottom = `${aspectRatio * 100}%`;
              columns[columnIndex].appendChild(div);
              columnIndex = (columnIndex + 1) % columns.length;
          });
      }

      function duplicateImages() {
          const columns = container.children;
          for (let column of columns) {
              column.innerHTML += column.innerHTML;
          }
      }

      function initializeBackground() {
          createImageColumns();
          fillColumns();
          duplicateImages();
      }

      initializeBackground();

      window.addEventListener('resize', () => {
          const newColumns = window.innerWidth <= 768 ? 2 : 7;
          if (newColumns !== columns) {
              columns = newColumns;
              initializeBackground();
          }
      });
  }
});
