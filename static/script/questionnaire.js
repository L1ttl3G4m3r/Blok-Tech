console.log("Server is running");

// Codepen.io: https://codepen.io/TessWieman/pen/GgRxepQ?editors=1100
var options = {
    direction: 'horizontal',
    loop: true,
    speed: 300,

    pagination: {
      el: '.swiper-pagination',
      type: 'fraction'
    },

    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    }
}

const swiper = new Swiper('.swiper', options)
const question1 = document.querySelectorAll("#question1 input[type='checkbox']")
const submitButton = document.querySelector("input[type='submit']")

function checkQuestion1 () {
    const isChecked = Array.from(question1).some(checkbox => checkbox.checked)
    submitButton.disabled = !isChecked
}

question1.forEach(checkbox => {
    checkbox.addEventListener("change", checkQuestion1)
})

checkQuestion1()
