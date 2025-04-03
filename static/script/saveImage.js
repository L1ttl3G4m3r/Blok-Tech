// opslaan image source veranderen
let save = document.querySelector(".save")
let originalSource = save.src
let filledSource = "/static/icons/normal/collection-fill.svg"


function changeSaveImage() {
  if (save.src.includes("/static/icons/normal/collection-fill.svg")) {
    save.src = originalSource // terug naar originiële afbeelding
    save.classList.remove("growAnimation")
  } else {
    save.src = filledSource // verander naar collection-fill afbeelding
    save.classList.add("growAnimation")
  }
}

save.addEventListener('click', changeSaveImage)
