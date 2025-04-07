const tabs = document.querySelectorAll('.tab');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active state from all tabs
    tabs.forEach(t => {
      t.classList.remove('active');
      t.querySelector('.icon-normal').classList.remove('hidden');
      t.querySelector('.icon-selected').classList.add('hidden');
    });

    // Add active state to clicked tab
    tab.classList.add('active');
    tab.querySelector('.icon-normal').classList.add('hidden');
    tab.querySelector('.icon-selected').classList.remove('hidden');

    // Show/hide content based on tab
    const target = tab.getAttribute('data-tab');
    document.querySelectorAll('.content').forEach(content => {
      content.classList.add('hidden');
    });
    document.getElementById(target).classList.remove('hidden');
  });
});
