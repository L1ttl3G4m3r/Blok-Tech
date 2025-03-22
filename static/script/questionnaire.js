console.log("Server is running");

// Scrollen naar de volgende section/vraag
// Codepen.io: https://codepen.io/TessWieman/pen/GgRxepQ?editors=1100
var options = {
    direction: 'horizontal', //richting van de carousel - de default
    loop: true, // van 25 naar 1 en vice versa
    speed: 300, // duur van transitie in ms
    // cssMode: true, // smoother
  
    // pagination
    pagination: {
      el: '.swiper-pagination', // class van de paginering
      type: 'fraction' // x/xx als paginering
    },
  
    // navigation arrows
    navigation: {
      nextEl: '.swiper-button-next', // class van next button
      prevEl: '.swiper-button-prev' // class van prev button
    }
}
  
//het daadwerkelijk initialiseren van de carousel 
const swiper = new Swiper('.swiper', options)


// De eerste vraag required maken
// De disabled button wordt enabled als er een checkbox is aangevinkt.
const question1 = document.querySelectorAll("#question1 input[type='checkbox']")
const submitButton = document.querySelector("input[type='submit']")

function checkQuestion1 () {
    // Array.from maakt een array van de checkboxes
    const isChecked = Array.from(question1).some(checkbox => checkbox.checked)
    submitButton.disabled = !isChecked
}

// Elke keer als er een checkbox wordt aangevinkt, wordt checkQuestion1 opnieuw uitgevoerd
// Het checkt of er minstens 1 checkbox is aangevinkt
question1.forEach(checkbox => {
    checkbox.addEventListener("change", checkQuestion1)
})

checkQuestion1()