document.addEventListener("DOMContentLoaded", () => {
  const imagePlaceholder = document.querySelector('.image-placeholder');
  const photoInput = document.getElementById('photoInput');
  const imagePreview = document.getElementById('imagePreview');
  const postForm = document.getElementById('postForm');
  const tagsInput = document.getElementById("tagsInput");
  const tagsList = document.getElementById("tagsList");
  const hiddenTagsInput = document.getElementById("hiddenTagsInput");
  let tags = [];

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
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Selecteer een geldig afbeeldingsbestand.');
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
      }
      reader.onerror = function () {
        alert("Er is een fout opgetreden bij het laden van de afbeelding.");
      };
      reader.readAsDataURL(file);
    }
  });

  postForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    try {
      const response = await fetch('/submitPost', {
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

  renderTags();
});
