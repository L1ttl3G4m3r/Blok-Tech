const mapboxToken = window.mapboxToken;
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("studioSearch");
  const searchResults = document.getElementById("searchResults");
  let sessionToken = generateSessionToken();

  function generateSessionToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  searchInput.addEventListener("input", async () => {
    const searchTerm = searchInput.value;

    if (searchTerm.length < 3) {
      searchResults.innerHTML = "";
      return;
    }

    try {
      const suggestUrl = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(
        searchTerm
      )}&language=nl&country=nl&proximity=4.9041,52.3676&types=poi&session_token=${sessionToken}&access_token=${mapboxToken}`;

      const suggestResponse = await fetch(suggestUrl);
      if (!suggestResponse.ok) {
        throw new Error(`HTTP error! status: ${suggestResponse.status}`);
      }
      const suggestData = await suggestResponse.json();

      searchResults.innerHTML = "";
      suggestData.suggestions.forEach((suggestion) => {
        const li = document.createElement("li");
        li.textContent = `${suggestion.name}, ${suggestion.full_address || "Geen adres beschikbaar"}`;
        li.addEventListener("click", async () => {
          try {
            const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${suggestion.mapbox_id}?session_token=${sessionToken}&access_token=${mapboxToken}`;
            const retrieveResponse = await fetch(retrieveUrl);
            if (!retrieveResponse.ok) {
              throw new Error(`HTTP error! status: ${retrieveResponse.status}`);
            }
            const retrieveData = await retrieveResponse.json();

            document.getElementById("studioName").value = retrieveData.features[0].properties.name || "";
            document.getElementById("studioAddress").value = retrieveData.features[0].properties.full_address || "";

            if (retrieveData.features[0].geometry && retrieveData.features[0].geometry.coordinates) {
              document.getElementById("studioLat").value = retrieveData.features[0].geometry.coordinates[1] || "";
              document.getElementById("studioLng").value = retrieveData.features[0].geometry.coordinates[0] || "";
            }

            searchResults.innerHTML = "";
            searchInput.value = ""; // Clear the search input after selection
          } catch (error) {
            console.error("Error retrieving data:", error);
          }
        });
        searchResults.appendChild(li);
      });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      searchResults.innerHTML = "<li>Error fetching results</li>";
    }
  });
});