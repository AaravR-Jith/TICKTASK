document.addEventListener('DOMContentLoaded', function() {
    // Profile editing functionality
    const profileUpload = document.getElementById('profile-upload');
    const profilePic = document.getElementById('profile-pic');
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
  
    editProfileBtn.addEventListener('click', () => profileUpload.click());
    
    profileUpload.addEventListener('change', function(e) {
      if (e.target.files.length) {
        const reader = new FileReader();
        reader.onload = function(event) {
          profilePic.src = event.target.result;
          localStorage.setItem('profilePic', event.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  
    // Load saved profile data
    if (localStorage.getItem('profilePic')) {
      profilePic.src = localStorage.getItem('profilePic');
    }
    if (localStorage.getItem('profileName')) {
      profileName.textContent = localStorage.getItem('profileName');
    }
    if (localStorage.getItem('profileEmail')) {
      profileEmail.textContent = localStorage.getItem('profileEmail');
    }
  
    // Sidebar toggle functionality
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    
    mobileMenuBtn.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
  
    // Section switching functionality
    const navItems = document.querySelectorAll('nav ul li');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        navItems.forEach(navItem => navItem.classList.remove('active'));
        contentSections.forEach(section => section.classList.remove('active'));
        
        this.classList.add('active');
        const sectionId = `${this.dataset.section}-section`;
        document.getElementById(sectionId).classList.add('active');
        
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
        
        if (this.dataset.section === 'calendar') {
          generateCalendar();
        } else if (this.dataset.section === 'analytics') {
          updateAnalytics();
        }
      });
    });
  
    // Current date display
    const currentDate = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', options);
  
    // Task array to store tasks
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  
    // DOM elements
    const taskInput = document.getElementById('new-task');
    const taskType = document.getElementById('task-type');
    const taskDate = document.getElementById('task-date');
    const taskPriority = document.getElementById('task-priority');
    const addTaskBtn = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const calendar = document.getElementById('calendar');
  
    // Initialize
    renderTasks();
    generateCalendar();
  
    // Add task
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') addTask();
    });
  
    // Filter tasks
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        renderTasks(this.dataset.filter);
      });
    });
  
    // Functions
    function addTask() {
      const title = taskInput.value.trim();
      if (!title) return;
  
      const newTask = {
        id: Date.now(),
        title,
        type: taskType.value,
        date: taskDate.value || formatDate(currentDate),
        priority: taskPriority.value,
        completed: false,
        createdAt: new Date().toISOString()
      };
  
      tasks.unshift(newTask);
      saveTasks();
      renderTasks();
      generateCalendar();
      updateAnalytics();
      
      // Reset input
      taskInput.value = '';
      taskDate.value = '';
    }
  
    function renderTasks(filter = 'all') {
      taskList.innerHTML = '';
  
      let filteredTasks = [...tasks];
     
      // Apply filters
      if (filter === 'today') {
        const today = formatDate(currentDate);
        filteredTasks = tasks.filter(task => task.date === today);
      } else if (filter === 'high') {
        filteredTasks = tasks.filter(task => task.priority === 'high');
      }
  
      if (filteredTasks.length === 0) {
        taskList.innerHTML = '<p class="no-tasks">No tasks found</p>';
        return;
      }
  
      filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
              <span class="task-type ${task.type}">${task.type}</span>
              <span>${formatDisplayDate(task.date)}</span>
              <span class="task-priority ${task.priority}">${task.priority}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="complete-btn" data-id="${task.id}">
              <i class="fas fa-check"></i>
            </button>
            <button class="delete-btn" data-id="${task.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        taskList.appendChild(taskElement);
      });
  
      // Add event listeners to new buttons
      document.querySelectorAll('.complete-btn').forEach(button => {
        button.addEventListener('click', toggleComplete);
      });
  
      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', deleteTask);
      });
    }
  
    function toggleComplete(e) {
      const taskId = parseInt(e.currentTarget.dataset.id);
      const taskIndex = tasks.findIndex(task => task.id === taskId);
     
      if (taskIndex !== -1) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveTasks();
        renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
        updateAnalytics();
      }
    }
  
    function deleteTask(e) {
      const taskId = parseInt(e.currentTarget.dataset.id);
      tasks = tasks.filter(task => task.id !== taskId);
      saveTasks();
      renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
      generateCalendar();
      updateAnalytics();
    }
  
    function saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  
    function generateCalendar() {
      calendar.innerHTML = '';
     
      // Calendar headers
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
      });
  
      // Get first day of month and total days
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
  
      // Add empty cells for days before first day
      for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendar.appendChild(emptyDay);
      }
  
      // Add days of month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
       
        // Highlight today
        if (day === currentDate.getDate() && month === currentDate.getMonth() && year === currentDate.getFullYear()) {
          dayElement.classList.add('today');
        }
  
        // Mark days with tasks
        const hasTasks = tasks.some(task => task.date === dateStr);
        if (hasTasks) dayElement.classList.add('has-tasks');
  
        dayElement.innerHTML = `
          <div>${day}</div>
        `;
        calendar.appendChild(dayElement);
      }
    }
  
    function updateAnalytics() {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.completed).length;
      const pendingTasks = totalTasks - completedTasks;
      
      document.getElementById('total-tasks').textContent = totalTasks;
      document.getElementById('completed-tasks').textContent = completedTasks;
      document.getElementById('pending-tasks').textContent = pendingTasks;
    }
  
    // Helper functions
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  
    function formatDisplayDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  });