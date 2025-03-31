document.addEventListener('DOMContentLoaded', function () {
    const elements = {
        navItems: document.querySelectorAll(".nav-item a"),
        tattooGridImages: document.querySelectorAll('#tattoo-grid img'),
        studioAddress: document.getElementById('studioAddres'),
        profilePhotos: document.querySelectorAll('.profile-photo-container'),
        photoOptionsMenu: document.getElementById('photoOptionsMenu'),
        closePhotoMenu: document.getElementById('closePhotoMenu'),
        form: document.getElementById('updateProfileForm'),
        editButton: document.getElementById('editButton'),
        saveButton: document.getElementById('saveButton'),
        usernameInput: document.getElementById('username'),
        emailInput: document.getElementById('email'),
        passwordInput: document.getElementById('password'),
        studioName: document.getElementById('studioname')
    };

    // Activeer huidige navigatie-item
    elements.navItems.forEach(item => {
        if (item.href === window.location.href) {
            item.parentElement.classList.add("active");
        }
    });

    // Tattoo grid klikfunctionaliteit
    elements.tattooGridImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            window.location.href = `/detail/${index}`;
        });
    });

    // Profielfoto menu
    elements.profilePhotos.forEach(photo => {
        photo.addEventListener('click', () => {
            elements.photoOptionsMenu.style.display = 'flex';
        });
    });

    elements.closePhotoMenu?.addEventListener('click', () => {
        elements.photoOptionsMenu.style.display = 'none';
    });

    // Profielbewerkingsformulier
    elements.editButton?.addEventListener('click', () => {
        const fields = [
            elements.usernameInput,
            elements.emailInput,
            elements.passwordInput,
            elements.studioName,
            elements.studioAddress
        ];

        fields.forEach(field => field.disabled = false);
        elements.saveButton.disabled = false;
    });

    elements.form?.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('Formulier succesvol verzonden');
    });

});


