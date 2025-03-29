document.addEventListener("DOMContentLoaded", function () {
  const photoOptionsMenu = document.getElementById("photoOptionsMenu");
  const closePhotoMenu = document.getElementById("closePhotoMenu");
  const chooseFromLibrary = document.getElementById("chooseFromLibrary");
  const takePhoto = document.getElementById("takePhoto");
  const uploadPhotoInput = document.getElementById("uploadPhotoInput"); // Het bestand invoerveld
  const profilePhoto = document.getElementById("profilePhoto");

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
        const formData = new FormData();
        formData.append("photo", file); // Voeg de gekozen foto toe aan de FormData

        // Foto uploaden naar de server
        uploadPhoto(formData);
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

            // Maak een canvas van de video feed en upload de foto
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            // Zet de foto om naar een bestand in plaats van een Data URL
            canvas.toBlob(function (blob) {
              const formData = new FormData();
              formData.append("photo", blob, "photo.png");

              // Upload de gemaakte foto naar de server
              uploadPhoto(formData);
            }, "image/png");
          });
        })
        .catch(function (error) {
          console.error("Er is een fout opgetreden bij het openen van de camera:", error);
        });
    } else {
      console.log("Camera wordt niet ondersteund door je browser");
    }
  });

  // Algemene functie om de foto naar de server te uploaden
  function uploadPhoto(formData) {
    fetch("/upload-photo", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          profilePhoto.src = data.photoUrl; // Werk de profielfoto bij
          alert("Profielfoto succesvol bijgewerkt!");
        } else {
          alert("Er is een fout opgetreden bij het uploaden van de foto");
        }
      })
      .catch((error) => {
        console.error("Error uploading photo:", error);
        alert("Er is een fout opgetreden bij het uploaden van de foto");
      });
  }
});
