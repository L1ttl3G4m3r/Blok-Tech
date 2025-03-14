
const filterButton = document.getElementById('filterButton');
const filterSidebar = document.getElementById('filterSidebar');
const closeButton = document.getElementById('closeSidebar');

filterButton.addEventListener('click', () => {
    if (filterSidebar.style.width === '340px') {
        filterSidebar.style.width = '0';
    } else {
        filterSidebar.style.width = '340px';
    }
});

closeButton.addEventListener('click', () => {
    filterSidebar.style.width = '0';
});

document.querySelector('.dropbtn').addEventListener('click', function() {
    document.querySelector('.dropdown-content').classList.toggle('show');
  });
  
  document.querySelectorAll('.dropdown-content a').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.dropdown-content a').forEach(function(link) {
        link.classList.remove('selected');
      });
      this.classList.add('selected');
      document.querySelector('.dropbtn').textContent = 'Sorteer op: ' + this.textContent;
      
      // Hier kun je de sorteerlogica toevoegen
      console.log('Sorteren op: ' + this.dataset.sort);
    });
  });
  
  window.addEventListener('click', function(e) {
    if (!e.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName('dropdown-content');
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  });