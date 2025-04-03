let openShareButton = document.querySelector(".openShare")
let closeShareButton = document.querySelector(".closeShare")
let shareMenu = document.querySelector(".share")

function openShare () {
  shareMenu.classList.add("toonMenu")
}

function closeShare () {
  shareMenu.classList.remove("toonMenu")
}

openShareButton.addEventListener('click', openShare)
closeShareButton.addEventListener('click', closeShare)
