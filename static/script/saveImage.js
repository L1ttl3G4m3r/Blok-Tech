// opslaan image source veranderen
let save = document.querySelector(".opslaan")
let originalSource = save.src
let filledSource = "/static/icons/normal/collection-fill.svg"


function changeSaveImage() {
  if (save.src.includes("/static/icons/normal/collection-fill.svg")) {
    save.src = originalSource // terug naar originiële afbeelding
  } else {
    save.src = filledSource // verander naar collection-fill afbeelding
  }
}

save.addEventListener('click', changeSaveImage)
