document.addEventListener('DOMContentLoaded', function() {
    const addPostLink = document.getElementById('addPostLink');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    addPostLink.addEventListener('click', function(e) {
        e.preventDefault(); // Voorkom de standaard link-actie
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            showMediaOptions();
        } else {
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            uploadImage(file);
        }
    });
    
    function showMediaOptions() {
        const options = ['Take Photo', 'Choose from Library'];
        const optionsHtml = options.map((option, index) => 
            `<button class="media-option" data-option="${index}">${option}</button>`
        ).join('');
        
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;">
                <div style="background: white; padding: 20px; border-radius: 10px;">
                    ${optionsHtml}
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target.classList.contains('media-option')) {
                const option = e.target.dataset.option;
                if (option === '0') {
                    // Take Photo
                    fileInput.setAttribute('capture', 'camera');
                } else {
                    // Choose from Library
                    fileInput.removeAttribute('capture');
                }
                fileInput.click();
                document.body.removeChild(modal);
            }
        });
    }
    
    function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log('Upload successful:', data);
            // You can add code here to display the uploaded image or update the UI
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
});