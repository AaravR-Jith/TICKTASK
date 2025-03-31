// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRbQKhLrE9bzHGYTewfrP-uG3_DR75Gfo",
  authDomain: "login-form-265f6.firebaseapp.com",
  projectId: "login-form-265f6",
  storageBucket: "login-form-265f6.appspot.com",
  messagingSenderId: "431116535291",
  appId: "1:431116535291:web:47ea2b4cd26dfc38c9775e"
};

// Initialize Firebase Authentication only
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', function() {
  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      const currentUser = user.uid;
      localStorage.setItem('currentUser', currentUser);
      
      // Set profile info from Firebase auth
      document.getElementById('profile-name').textContent = user.displayName || user.email.split('@')[0] || 'User';
      document.getElementById('profile-email').textContent = user.email;
      
      // Set profile picture if available
      if (user.photoURL) {
        document.getElementById('profile-pic').src = user.photoURL;
      }
      
      // Initialize user data in localStorage if it doesn't exist
      if (!localStorage.getItem(`user_${currentUser}`)) {
        localStorage.setItem(`user_${currentUser}`, JSON.stringify({
          name: user.displayName || user.email.split('@')[0] || 'User',
          email: user.email,
          profilePic: user.photoURL || 'assets/profile.png'
        }));
      }
      
      // Initialize tasks if they don't exist
      if (!localStorage.getItem(`tasks_${currentUser}`)) {
        localStorage.setItem(`tasks_${currentUser}`, JSON.stringify([]));
      }
      
      // Load user data and tasks
      loadUserData(currentUser);
    } else {
      // No user is signed in, redirect to login
      window.location.href = 'login.html';
    }
  });

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
      
      if (this.dataset.section === 'analytics') {
        updateAnalytics();
      } else if (this.dataset.section === 'calendar') {
        renderCalendar(currentMonth, currentYear);
      }
    });
  });

  // Profile editing functionality
  const profileModal = document.getElementById('profile-modal');
  const closeModal = document.querySelector('.close-modal');
  const profileForm = document.getElementById('profile-form');
  const editName = document.getElementById('edit-name');
  const editEmail = document.getElementById('edit-email');
  const editPic = document.getElementById('edit-pic');
  const profileUpload = document.getElementById('profile-upload');
  const profilePic = document.getElementById('profile-pic');
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const editProfileBtn = document.querySelector('.edit-profile-btn');

  // Open modal when edit button is clicked
  editProfileBtn.addEventListener('click', function(e) {
    e.preventDefault();
    editName.value = profileName.textContent;
    editEmail.value = profileEmail.textContent;
    profileModal.style.display = 'block';
  });

  // Close modal when X is clicked
  closeModal.addEventListener('click', function() {
    profileModal.style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === profileModal) {
      profileModal.style.display = 'none';
    }
  });

  // Handle profile form submission
  profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = editName.value.trim();
    const email = editEmail.value.trim();
    const currentUser = localStorage.getItem('currentUser');
    
    const userUpdate = {
      name: name,
      email: email,
      updatedAt: new Date().toISOString()
    };
    
    if (editPic.files.length > 0) {
      const file = editPic.files[0];
      const reader = new FileReader();
      
      reader.onload = function(event) {
        userUpdate.profilePic = event.target.result;
        localStorage.setItem(`user_${currentUser}`, JSON.stringify(userUpdate));
        
        // Update UI
        profilePic.src = event.target.result;
        profileName.textContent = name;
        profileEmail.textContent = email;
        
        profileModal.style.display = 'none';
      };
      
      reader.readAsDataURL(file);
    } else {
      localStorage.setItem(`user_${currentUser}`, JSON.stringify(userUpdate));
      
      // Update UI
      profileName.textContent = name;
      profileEmail.textContent = email;
      
      profileModal.style.display = 'none';
    }
  });

  // Handle direct profile picture upload (camera button)
  profileUpload.addEventListener('change', function(e) {
    if (e.target.files.length) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const currentUser = localStorage.getItem('currentUser');
        const userData = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || {};
        userData.profilePic = event.target.result;
        localStorage.setItem(`user_${currentUser}`, JSON.stringify(userData));
        profilePic.src = event.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  // Calendar variables
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  const calendarGrid = document.getElementById('calendar-grid');
  const calendarDateDisplay = document.getElementById('calendar-date-display');

  // Task array to store tasks
  let tasks = [];

  // DOM elements
  const taskInput = document.getElementById('new-task');
  const taskType = document.getElementById('task-type');
  const taskDate = document.getElementById('task-date');
  const taskPriority = document.getElementById('task-priority');
  const addTaskBtn = document.getElementById('add-task');
  const taskList = document.getElementById('task-list');
  const filterButtons = document.querySelectorAll('.filter-btn');

  // Current date display
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);

  // Set default task date to today
  taskDate.value = formatDate(new Date());

  // Load user data and tasks
  function loadUserData(userId) {
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem(`user_${userId}`)) || {
      name: 'User',
      email: '',
      profilePic: 'assets/profile.png'
    };
    
    // Update profile UI
    profileName.textContent = userData.name;
    profileEmail.textContent = userData.email;
    profilePic.src = userData.profilePic;
    
    // Load tasks from localStorage
    tasks = JSON.parse(localStorage.getItem(`tasks_${userId}`)) || [];
    
    // Initialize the UI
    renderTasks();
    renderCalendar(currentMonth, currentYear);
    updateAnalytics();
  }

  // Save tasks to localStorage
  function saveTasks() {
    const currentUser = localStorage.getItem('currentUser');
    localStorage.setItem(`tasks_${currentUser}`, JSON.stringify(tasks));
  }

  // Add task
  addTaskBtn.addEventListener('click', addTask);
  taskInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addTask();
  });

  function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    const newTask = {
      id: Date.now().toString(),
      title: title,
      type: taskType.value,
      date: taskDate.value || formatDate(new Date()),
      priority: taskPriority.value,
      completed: false,
      createdAt: new Date().toISOString(),
      userId: currentUser
    };

    tasks.unshift(newTask);
    saveTasks();
    
    // Update UI
    renderTasks();
    renderCalendar(currentMonth, currentYear);
    updateAnalytics();
    
    // Reset form
    taskInput.value = '';
    taskDate.value = formatDate(new Date());
  }

  // Filter tasks
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      renderTasks(this.dataset.filter);
    });
  });

  // Calendar navigation
  prevMonthBtn.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
  });

  nextMonthBtn.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderCalendar(currentMonth, currentYear);
  });

  // Toggle task completion
  function toggleComplete(e) {
    const taskId = e.currentTarget.dataset.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      tasks[taskIndex].completed = !tasks[taskIndex].completed;
      saveTasks();
      renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
      renderCalendar(currentMonth, currentYear);
      updateAnalytics();
    }
  }

  // Delete task
  function deleteTask(e) {
    const taskId = e.currentTarget.dataset.id;
    
    if (!confirm("Are you sure you want to delete this task?")) return;
    
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
    renderCalendar(currentMonth, currentYear);
    updateAnalytics();
  }

  // Render tasks function
  function renderTasks(filter = 'all') {
    taskList.innerHTML = '';
    let filteredTasks = [...tasks];
    
    // Apply filters
    if (filter === 'today') {
      const today = formatDate(new Date());
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
    
    document.querySelectorAll('.complete-btn').forEach(button => {
      button.addEventListener('click', toggleComplete);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', deleteTask);
    });
  }

  // Render calendar function
  function renderCalendar(month, year) {
    calendarDateDisplay.textContent = new Date(year, month).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
    calendarGrid.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
    
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarGrid.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      const dateStr = formatDate(new Date(year, month, day));
      
      const isToday = isCurrentMonth && day === today.getDate();
      dayElement.className = `calendar-day ${isToday ? 'today' : ''}`;
      
      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);
      
      const dayTasks = tasks.filter(task => task.date === dateStr);
      if (dayTasks.length > 0) {
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'day-tasks';
        
        dayTasks.forEach(task => {
          const taskElement = document.createElement('div');
          taskElement.className = `task-item-calendar ${task.priority} ${task.completed ? 'completed' : ''}`;
          
          taskElement.innerHTML = `
            <span class="task-dot ${task.priority}"></span>
            ${task.title}
          `;
          tasksContainer.appendChild(taskElement);
        });
        
        dayElement.appendChild(tasksContainer);
      }
      
      calendarGrid.appendChild(dayElement);
    }
  }

  // Update analytics function
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

  // Add logout button
  const logoutBtn = document.createElement('button');
  logoutBtn.textContent = 'Logout';
  logoutBtn.className = 'logout-btn';
  logoutBtn.style.marginTop = '20px';
  logoutBtn.style.width = '100%';
  logoutBtn.style.padding = '10px';
  logoutBtn.style.backgroundColor = '#e74c3c';
  logoutBtn.style.color = 'white';
  logoutBtn.style.border = 'none';
  logoutBtn.style.borderRadius = '5px';
  logoutBtn.style.cursor = 'pointer';
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  });

  document.querySelector('.sidebar').appendChild(logoutBtn);
});

// Theme Customization
document.addEventListener('DOMContentLoaded', function() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'default';
  const savedMode = localStorage.getItem('mode') || 'light';
  
  // Apply saved theme
  applyTheme(savedTheme, savedMode);
  
  // Color selection
  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', function() {
      const color = this.dataset.color;
      applyTheme(color, savedMode);
      localStorage.setItem('theme', color);
    });
  });
  
  // Mode selection
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const mode = this.dataset.mode;
      applyTheme(savedTheme, mode);
      localStorage.setItem('mode', mode);
    });
  });
  
  // Function to apply theme
  function applyTheme(theme, mode) {
    // Remove all theme classes first
    document.body.classList.remove(
      'theme-default', 'theme-green', 'theme-purple', 
      'theme-red', 'theme-orange', 'dark-mode', 'light-mode'
    );
    
    // Apply color theme if not default
    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`);
    }
    
    // Apply mode
    document.body.classList.add(`${mode}-mode`);
    
    // Update active buttons
    document.querySelectorAll('.color-option').forEach(opt => 
      opt.classList.remove('active')
    );
    document.querySelector(`.color-option[data-color="${theme}"]`)?.classList.add('active');
    
    document.querySelectorAll('.mode-btn').forEach(btn => 
      btn.classList.remove('active')
    );
    document.querySelector(`.mode-btn[data-mode="${mode}"]`)?.classList.add('active');
    
    // Update UI elements that need specific color changes
    updateThemeColors();
  }
  
  // Function to update theme-dependent elements
  function updateThemeColors() {
    const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim();
    
    // Update elements that need explicit color changes
    document.querySelectorAll('.sidebar nav ul li.active').forEach(el => 
      el.style.backgroundColor = primaryColor
    );
    
    document.querySelectorAll(
      '.filter-btn.active, .task-options button, .edit-profile-btn, ' +
      '.save-btn, .calendar-navigation button, .mode-btn.active'
    ).forEach(el => 
      el.style.backgroundColor = primaryColor
    );
    
    document.querySelectorAll('.profile-img').forEach(el => 
      el.style.borderColor = primaryColor
    );
    
    document.querySelectorAll('.color-option.active').forEach(el => 
      el.style.boxShadow = `0 0 0 2px white, 0 0 0 4px ${primaryColor}`
    );
  }
});