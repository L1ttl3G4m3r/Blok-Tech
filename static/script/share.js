let openShareButton = document.querySelector(".openDelen")
let closeShareButton = document.querySelector(".sluitDelen")
let shareMenu =  document.querySelector(".delen")

function openShare () {
  console.log("open")
  shareMenu.classList.add("toonMenu")
}

function closeShare () {
  shareMenu.classList.remove("toonMenu")
}

openShareButton.addEventListener('click', openShare)
closeShareButton.addEventListener('click', closeShare)
