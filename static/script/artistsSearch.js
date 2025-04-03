document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById('artist-search-input');
  const resultsContainer = document.createElement('div');
  resultsContainer.id = 'searchResults';
  input.parentNode.insertBefore(resultsContainer, input.nextSibling);

  input.addEventListener('input', debounce(searchArtists, 300));

  async function searchArtists() {
      const query = input.value;
      if (query.length < 2) {
          resultsContainer.innerHTML = '';
          return;
      }

      try {
          const response = await fetch(`/searchArtists?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          displayResults(data.artists);
      } catch (error) {
          console.error('Error searching artists:', error);
      }
  }

  function displayResults(artists) {
      resultsContainer.innerHTML = '';
      artists.forEach(artist => {
          const link = document.createElement('a');
          link.href = `/artist/${artist._id}`;
          link.textContent = `${artist.username} - ${artist.studio.name}`;
          resultsContainer.appendChild(link);
      });
  }

  function debounce(func, delay) {
      let timeoutId;
      return function(...args) {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(this, args), delay);
      };
  }
});
