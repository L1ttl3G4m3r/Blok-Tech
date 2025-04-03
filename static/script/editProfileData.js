document.addEventListener('DOMContentLoaded', function () {
  const editButton = document.getElementById('editButton');
  const saveButton = document.getElementById('saveButton');
  const form = document.getElementById('updateProfileForm');

  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  editButton?.addEventListener('click', () => {
      const fields = [usernameInput, emailInput, passwordInput];

      fields.forEach(field => field.disabled = false);
      if (saveButton) saveButton.disabled = false;
  });

  form?.addEventListener('submit', function (e) {
      e.preventDefault();
      console.log('Formulier succesvol verzonden');
  });
});
