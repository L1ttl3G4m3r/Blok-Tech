document.addEventListener("DOMContentLoaded", () => {
  const mapboxToken = window.mapboxToken;

  // Studio zoeken elementen
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const studioName = document.getElementById("studioName");
  const studioAddress = document.getElementById("studioAddress");
  const studioLat = document.getElementById("studioLat");
  const studioLng = document.getElementById("studioLng");
  let sessionToken = generateSessionToken();

  // Tags elementen
  const tagsInput = document.getElementById("tagsInput");
  const tagsList = document.getElementById("tagsList");
  const hiddenTagsInput = document.getElementById("hiddenTagsInput");
  let tags = [];

  // Afbeelding uploaden
  const imagePlaceholder = document.querySelector('.image-placeholder');
  const photoInput = document.getElementById('photoInput');
  const imagePreview = document.getElementById('imagePreview');

  // Formulier
  const postForm = document.getElementById('postForm');

  imagePlaceholder.addEventListener('click', function() {
    photoInput.click();
});

  // Functie om een sessie-token te genereren voor Mapbox API
  function generateSessionToken() {
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Studio zoeken functionaliteit
  searchInput.addEventListener("input", debounce(handleSearch, 300));

  function handleSearch() {
      const searchTerm = searchInput.value;
      if (searchTerm.length < 3) {
          searchResults.innerHTML = "";
          return;
      }

      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(searchTerm)}&language=nl&country=nl&proximity=4.9041,52.3676&types=poi&session_token=${sessionToken}&access_token=${mapboxToken}`;

      fetch(url)
          .then(response => response.json())
          .then(data => {
              searchResults.innerHTML = "";
              if (!data.suggestions || data.suggestions.length === 0) {
                  searchResults.innerHTML = "<li>Geen resultaten gevonden</li>";
                  return;
              }
              data.suggestions.forEach((suggestion) => {
                  const li = document.createElement("li");
                  li.textContent = `${suggestion.name}, ${suggestion.full_address || "Geen adres beschikbaar"}`;
                  li.addEventListener("click", () => handleSuggestionClick(suggestion));
                  searchResults.appendChild(li);
              });
          })
          .catch(error => {
              console.error("Error fetching suggestions:", error);
              searchResults.innerHTML = "<li>Fout bij ophalen van resultaten</li>";
          });
  }

  function handleSuggestionClick(suggestion) {
      const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken}&access_token=${mapboxToken}`;

      fetch(retrieveUrl)
          .then(response => response.json())
          .then(data => {
              if (!data.features || data.features.length === 0) {
                  alert("Kon geen details ophalen voor deze locatie.");
                  return;
              }
              const feature = data.features[0];
              studioName.value = feature.properties.name || "";
              studioAddress.value = feature.properties.full_address || "";
              studioLat.value = feature.geometry.coordinates[1] || "";
              studioLng.value = feature.geometry.coordinates[0] || "";
              searchResults.innerHTML = "";
              searchInput.value = "";
          })
          .catch(error => {
              console.error("Error retrieving data:", error);
              alert("Er is een fout opgetreden bij het ophalen van de locatiegegevens.");
          });
  }

  function debounce(func, delay) {
      let timeoutId;
      return function () {
          const context = this;
          const args = arguments;
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func.apply(context, args), delay);
      };
  }
  imagePlaceholder.addEventListener('click', function() {
      photoInput.click();
  });

  // Tags functionaliteit
  function renderTags() {
      tagsList.innerHTML = "";
      tags.forEach((tag, index) => {
          const tagElement = document.createElement("span");
          tagElement.classList.add("tag");
          tagElement.innerHTML = `${tag} <span class="tag-remove">×</span>`;
          tagElement.querySelector(".tag-remove").addEventListener("click", () => removeTag(index));
          tagsList.appendChild(tagElement);
      });
      hiddenTagsInput.value = tags.join(",");
  }

  function addTag(tag) {
      const sanitizedTag = tag.trim().toLowerCase();
      if (sanitizedTag && !tags.includes(sanitizedTag)) {
          tags.push(sanitizedTag);
          renderTags();
      }
  }

  function removeTag(index) {
      tags.splice(index, 1);
      renderTags();
  }

  tagsInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
          event.preventDefault();
          const newTag = tagsInput.value.trim();
          if (newTag) {
              addTag(newTag);
              tagsInput.value = "";
          }
      }
  });

  photoInput.addEventListener('change', function (event) {
      if (event.target.files && event.target.files[0]) {
          const reader = new FileReader();
          reader.onload = function (e) {
              imagePreview.src = e.target.result;
          }
          reader.onerror = function () {
              alert("Er is een fout opgetreden bij het laden van de afbeelding.");
          };
          reader.readAsDataURL(event.target.files[0]);
      }
  });

  // Formulier verzenden
  postForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      const formData = new FormData(this);

      try {
          const response = await fetch('/submit-post', {
              method: 'POST',
              body: formData
          });

          if (response.ok) {
              alert('Post succesvol toegevoegd!');
              window.location.href = '/index';
          } else {
              alert(`Er is een fout opgetreden bij het toevoegen van de post: ${response.statusText || 'Onbekende fout'}`);
          }
      } catch (error) {
          console.error('Error:', error);
          alert('Er is een fout opgetreden bij het versturen van de post: ' + error.message);
      }
  });

  // Initialize
  renderTags();
});



