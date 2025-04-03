document.addEventListener("DOMContentLoaded", function () {
  const photoOptionsMenu = document.getElementById("photoOptionsMenu");
  const closePhotoMenu = document.getElementById("closePhotoMenu");
  const chooseFromLibrary = document.getElementById("chooseFromLibrary");
  const takePhoto = document.getElementById("takePhoto");
  const uploadPhotoInput = document.getElementById("uploadPhotoInput");
  const profilePhoto = document.getElementById("profilePhoto");

  function closePhotoOptionsMenu() {
    photoOptionsMenu.style.display = "none";
  }

  function openPhotoOptionsMenu() {
    photoOptionsMenu.style.display = "flex";
  }

  document.querySelector(".profile-photo-container").addEventListener("click", openPhotoOptionsMenu);
  closePhotoMenu.addEventListener("click", closePhotoOptionsMenu);

  chooseFromLibrary.addEventListener("click", function () {
    console.log("Kies uit fotobibliotheek");
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.click();

    fileInput.addEventListener("change", function (event) {
      if (event.target.files.length > 0) {
        const file = event.target.files[0];
        const formData = new FormData();
        formData.append("photo", file);
        uploadPhoto(formData);
      }
    });
  });

  takePhoto.addEventListener("click", function () {
    console.log("Maak foto met camera");
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
          const videoElement = document.createElement("video");
          videoElement.srcObject = stream;
          videoElement.play();

          document.body.appendChild(videoElement);

          videoElement.addEventListener("click", function () {
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(videoElement);

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(function (blob) {
              const formData = new FormData();
              formData.append("photo", blob, "photo.png");

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

  function uploadPhoto(formData) {
    fetch("/uploadPhoto", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          profilePhoto.src = data.photoUrl;
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
