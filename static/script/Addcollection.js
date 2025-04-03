document.querySelectorAll('.add-to-collection').forEach(button => {
  button.addEventListener('click', async () => {
    const imageUrl = button.getAttribute('data-url');

    try {
      const response = await fetch('/addToCollection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      });

      if (response.ok) {
        alert('Image added to your collection!');
      } else {
        alert('Failed to add image.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred.');
    }
  });
});
