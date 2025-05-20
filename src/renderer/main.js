document.addEventListener('DOMContentLoaded', async () => {
  // DOM элементы
  const titleInput = document.getElementById('titleInput');
  const episodesInput = document.getElementById('episodesInput');
  const statusSelect = document.getElementById('statusSelect');
  const ratingInput = document.getElementById('ratingInput');
  const coverInput = document.getElementById('coverInput');
  const coverPreview = document.getElementById('coverPreview');
  const removeCoverBtn = document.getElementById('removeCoverBtn');
  const addBtn = document.getElementById('addBtn');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');
  const tableBody = document.querySelector('#titlesTable tbody');
  
  let titles = [];
  let editingId = null;
  let currentCover = null;

  // Загрузка данных
  async function loadTitles() {
    titles = await window.electronAPI.loadTitles() || [];
    renderTable();
  }

  // Отображение таблицы
  function renderTable(filteredTitles = null) {
    const data = filteredTitles || titles;
    tableBody.innerHTML = '';
    
    data.forEach(title => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td class="cover-cell">
          ${title.cover ? 
            `<img src="${title.cover}" class="cover-thumbnail" 
                  onerror="this.parentElement.innerHTML='<div class=\\'no-cover\\'>Нет</div>'">` : 
            '<div class="no-cover">Нет</div>'}
        </td>
        <td>${title.name}</td>
        <td>${title.episodes}</td>
        <td>${getStatusText(title.status)}</td>
        <td>${title.rating || '-'}</td>
        <td>
          <div style="display:flex; flex-direction:column">
              <button class="action-btn edit-btn" data-id="${title.id}" style="margin:8px 0px">✏️</button>
              <button class="action-btn delete-btn" data-id="${title.id}" style="margin:8px 0px">🗑️</button>
          </div>

        </td>
      `;
      
      tableBody.appendChild(row);
    });
    
    // Обработчики кнопок
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => editTitle(e.target.dataset.id));
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteTitle(e.target.dataset.id));
    });
  }

  // Сохранение тайтла
  async function saveTitle() {
    const name = titleInput.value.trim();
    if (!name) {
      alert('Введите название тайтла');
      return;
    }
    
    const titleData = {
      name,
      episodes: parseInt(episodesInput.value) || 0,
      status: statusSelect.value,
      rating: ratingInput.value ? parseInt(ratingInput.value) : null,
      cover: currentCover
    };

    if (editingId) {
      const index = titles.findIndex(t => t.id === editingId);
      if (index !== -1) {
        titles[index] = { ...titles[index], ...titleData };
      }
      editingId = null;
      addBtn.textContent = 'Добавить';
    } else {
      titles.push({
        id: Date.now().toString(),
        ...titleData,
        createdAt: new Date().toISOString()
      });
    }

    await window.electronAPI.saveTitles(titles);
    resetForm();
    renderTable();
  }

  // Редактирование тайтла
  function editTitle(id) {
    const title = titles.find(t => t.id === id);
    if (title) {
      titleInput.value = title.name;
      episodesInput.value = title.episodes;
      statusSelect.value = title.status;
      ratingInput.value = title.rating || '';
      currentCover = title.cover || null;
      
      coverPreview.innerHTML = currentCover ? 
        `<img src="${currentCover}" alt="Превью обложки">` : 
        '';
      
      editingId = id;
      addBtn.textContent = 'Сохранить';
    }
  }

  // Удаление тайтла
  async function deleteTitle(id) {
    if (confirm('Вы уверены, что хотите удалить этот тайтл?')) {
      titles = titles.filter(t => t.id !== id);
      await window.electronAPI.saveTitles(titles);
      renderTable();
    }
  }

  // Сброс формы
  function resetForm() {
    titleInput.value = '';
    episodesInput.value = '';
    ratingInput.value = '';
    statusSelect.value = 'completed';
    currentCover = null;
    coverPreview.innerHTML = '';
    editingId = null;
    addBtn.textContent = 'Добавить';
  }

  // Текст статуса
  function getStatusText(status) {
    const statusMap = {
      'completed': 'Завершено',
      'watching': 'Смотрю',
      'planned': 'В планах'
    };
    return statusMap[status] || status;
  }

  // Фильтрация
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = filterSelect.value;
    
    let filtered = titles.filter(t => 
      filterValue === 'all' || t.status === filterValue
    );
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchTerm)
      );
    }
    
    renderTable(filtered);
  }

  // Обработчики событий
  coverInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1000000) { // 1MB лимит
      alert('Максимальный размер обложки - 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      currentCover = event.target.result;
      coverPreview.innerHTML = `<img src="${currentCover}" alt="Превью обложки">`;
    };
    reader.readAsDataURL(file);
  });

  removeCoverBtn.addEventListener('click', () => {
    currentCover = null;
    coverPreview.innerHTML = '';
  });

  addBtn.addEventListener('click', saveTitle);
  searchInput.addEventListener('input', applyFilters);
  filterSelect.addEventListener('change', applyFilters);

  // Инициализация
  loadTitles();
});