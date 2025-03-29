document.addEventListener("DOMContentLoaded", function () {
  const photoOptionsMenu = document.getElementById("photoOptionsMenu");
  const closePhotoMenu = document.getElementById("closePhotoMenu");
  const chooseFromLibrary = document.getElementById("chooseFromLibrary");
  const takePhoto = document.getElementById("takePhoto");

  // Functie om de foto-opties te sluiten
  function closePhotoOptionsMenu() {
      photoOptionsMenu.style.display = "none"; // Sluit de popup
  }

  // Functie om de foto-opties te openen
  function openPhotoOptionsMenu() {
      photoOptionsMenu.style.display = "flex"; // Open de popup
  }

  // Evenementlistener om de foto-opties te openen
  document.querySelector(".profile-photo-container").addEventListener("click", openPhotoOptionsMenu);

  // Sluit het menu wanneer op de 'close' knop wordt geklikt
  closePhotoMenu.addEventListener("click", closePhotoOptionsMenu);

  // Actie voor "Kies uit fotobibliotheek"
  chooseFromLibrary.addEventListener("click", function () {
      console.log("Kies uit fotobibliotheek");
      // Hier kun je een bestand kiezen vanuit de bibliotheek.
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.click();

      fileInput.addEventListener("change", function (event) {
          if (event.target.files.length > 0) {
              const file = event.target.files[0];
              const reader = new FileReader();
              reader.onload = function (e) {
                  const imageSrc = e.target.result;
                  document.getElementById("profilePhoto").src = imageSrc;
              };
              reader.readAsDataURL(file);
          }
      });
  });

  // Actie voor "Maak foto met camera"
  takePhoto.addEventListener("click", function () {
      console.log("Maak foto met camera");
      // Hier kun je de camera openen om een foto te maken
      // Dit is alleen beschikbaar als de browser dit ondersteunt
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ video: true })
              .then(function (stream) {
                  const videoElement = document.createElement("video");
                  videoElement.srcObject = stream;
                  videoElement.play();

                  // Voeg video-element toe aan de DOM om de camera feed weer te geven
                  document.body.appendChild(videoElement);

                  // Stop de stream als je klaar bent met de camera
                  videoElement.addEventListener("click", function () {
                      stream.getTracks().forEach(track => track.stop());
                      document.body.removeChild(videoElement);
                  });
              })
              .catch(function (error) {
                  console.error("Er is een fout opgetreden bij het openen van de camera:", error);
              });
      } else {
          console.log("Camera wordt niet ondersteund door je browser");
      }
  });
});
