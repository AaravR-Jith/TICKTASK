
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRbQKhLrE9bzHGYTewfrP-uG3_DR75Gfo",
  authDomain: "login-form-265f6.firebaseapp.com",
  projectId: "login-form-265f6",
  storageBucket: "login-form-265f6.appspot.com",
  messagingSenderId: "431116535291",
  appId: "1:431116535291:web:47ea2b4cd26dfc38c9775e"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      loadUserData(user.uid);
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
  profileForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = editName.value.trim();
    const email = editEmail.value.trim();
    const user = auth.currentUser;
    
    if (!user) return;
    
    try {
      const userUpdate = {
        name: name,
        email: email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      if (editPic.files.length > 0) {
        const file = editPic.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(event) {
          userUpdate.profilePic = event.target.result;
          await db.collection('users').doc(user.uid).set(userUpdate, { merge: true });
          
          // Update UI
          profilePic.src = event.target.result;
          profileName.textContent = name;
          profileEmail.textContent = email;
          
          profileModal.style.display = 'none';
        };
        
        reader.readAsDataURL(file);
      } else {
        await db.collection('users').doc(user.uid).set(userUpdate, { merge: true });
        
        // Update UI
        profileName.textContent = name;
        profileEmail.textContent = email;
        
        profileModal.style.display = 'none';
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  });

  // Handle direct profile picture upload (camera button)
  profileUpload.addEventListener('change', function(e) {
    if (e.target.files.length) {
      const reader = new FileReader();
      reader.onload = async function(event) {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
          await db.collection('users').doc(user.uid).set({
            profilePic: event.target.result
          }, { merge: true });
          
          profilePic.src = event.target.result;
        } catch (error) {
          console.error("Error updating profile picture:", error);
        }
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

  // Reminder elements
  const setReminderCheckbox = document.getElementById('set-reminder');
  const reminderDetails = document.getElementById('reminder-details');
  const reminderTime = document.getElementById('reminder-time');
  const reminderTimeSpecific = document.getElementById('reminder-time-specific');

  // Toggle reminder details
  setReminderCheckbox.addEventListener('change', function() {
    reminderDetails.style.display = this.checked ? 'block' : 'none';
  });

  // Current date display
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', options);

  // Set default task date to today
  taskDate.value = formatDate(new Date());

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

  async function loadUserData(userId) {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const currentUser = auth.currentUser;
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        
        // Update profile information in the UI
        profileName.textContent = userData.name || currentUser.displayName || 'User';
        profileEmail.textContent = userData.email || currentUser.email;
        
        // Handle profile picture
        if (userData.profilePic) {
          profilePic.src = userData.profilePic;
        } else {
          // Try to get photo from auth provider if available
          profilePic.src = currentUser.photoURL || 'assets/profile.png';
        }
        
        // Update the last login time
        await db.collection('users').doc(userId).set({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          name: userData.name || currentUser.displayName || 'User',
          email: userData.email || currentUser.email
        }, { merge: true });
        
      } else {
        // Create a new user document with data from auth provider
        await db.collection('users').doc(userId).set({
          name: currentUser.displayName || 'User',
          email: currentUser.email,
          profilePic: currentUser.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Set default UI values
        profileName.textContent = currentUser.displayName || 'User';
        profileEmail.textContent = currentUser.email;
        profilePic.src = currentUser.photoURL || 'assets/profile.png';
      }
      // Load user tasks
      const tasksSnapshot = await db.collection('tasks')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      tasks = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to Date if needed
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        date: doc.data().date || formatDate(new Date())
      }));
      
      renderTasks();
      renderCalendar(currentMonth, currentYear);
      updateAnalytics();
      
    } catch (error) {
      console.error("Error loading user data:", error);
      // Show user-friendly error message
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = 'Failed to load user data. Please refresh the page.';
      document.querySelector('.content').prepend(errorMessage);
      
      // Remove error message after 5 seconds
      setTimeout(() => {
        errorMessage.remove();
      }, 5000);
    }
  }

  // Add task function with reminder support
  async function addTask() {
    const title = taskInput.value.trim();
    if (!title) return;
    const user = auth.currentUser;
    if (!user) return;
    const newTask = {
      title,
      type: taskType.value,
      date: taskDate.value || formatDate(new Date()),
      priority: taskPriority.value,
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      userId: user.uid
    };
    
    // Add reminder data if set
    if (setReminderCheckbox.checked) {
      newTask.reminder = {
        minutesBefore: parseInt(reminderTime.value),
        specificTime: reminderTimeSpecific.value
      };
      
      // Calculate reminder time
      const taskDateTime = calculateReminderTime(newTask.date, newTask.reminder);
      newTask.reminderTime = taskDateTime;
      
      // Schedule notification
      scheduleNotification(newTask, taskDateTime);
    }
    
    try {
      const docRef = await db.collection('tasks').add(newTask);
      newTask.id = docRef.id;
      tasks.unshift(newTask);
      
      renderTasks();
      renderCalendar(currentMonth, currentYear);
      updateAnalytics();
      
      // Reset inputs
      taskInput.value = '';
      taskDate.value = formatDate(new Date());
      setReminderCheckbox.checked = false;
      reminderDetails.style.display = 'none';
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }

  // Calculate reminder time
  function calculateReminderTime(taskDate, reminder) {
    const date = new Date(taskDate);
    
    if (reminder.specificTime) {
      // Set specific time
      const [hours, minutes] = reminder.specificTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
      
      // Subtract reminder minutes
      date.setMinutes(date.getMinutes() - reminder.minutesBefore);
    } else {
      // Default to 9 AM if no specific time
      date.setHours(9, 0);
      date.setMinutes(date.getMinutes() - reminder.minutesBefore);
    }
    
    return date;
  }

  // Schedule notification
  function scheduleNotification(task, reminderTime) {
    const now = new Date();
    const timeUntilReminder = reminderTime - now;
    
    if (timeUntilReminder > 0) {
      setTimeout(() => {
        showNotification(task);
      }, timeUntilReminder);
    }
  }

  // Show notification
  function showNotification(task) {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support desktop notification");
      showInAppNotification(task);
      return;
    }
    
    // Check notification permissions
    if (Notification.permission === "granted") {
      createNotification(task);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          createNotification(task);
        } else {
          showInAppNotification(task);
        }
      });
    } else {
      showInAppNotification(task);
    }
  }

  // Create browser notification
  function createNotification(task) {
    const notification = new Notification(`Reminder: ${task.title}`, {
      body: `Your task "${task.title}" is coming up!`,
      icon: 'assets/notification-icon.png'
    });
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }

  // Show in-app notification
  function showInAppNotification(task) {
    const notification = document.createElement('div');
    notification.className = 'in-app-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <h3>Reminder: ${task.title}</h3>
        <p>Your task is coming up!</p>
        <button class="dismiss-btn">Dismiss</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
    
    // Manual dismiss
    notification.querySelector('.dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });
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
      
      // Add reminder indicator if task has reminder
      const reminderIndicator = task.reminder ?
        `<span class="reminder-indicator" title="Reminder set"><i class="fas fa-bell"></i></span>` : '';
      
      taskElement.innerHTML = `
        <div class="task-info">
          <div class="task-title">${task.title} ${reminderIndicator}</div>
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarGrid.appendChild(emptyDay);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      const dateStr = formatDate(new Date(year, month, day));
      
      // Check if this is today
      const isToday = isCurrentMonth && day === today.getDate();
      dayElement.className = `calendar-day ${isToday ? 'today' : ''}`;
      
      // Add day number
      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = day;
      dayElement.appendChild(dayNumber);
      
      // Add tasks for this day
      const dayTasks = tasks.filter(task => task.date === dateStr);
      if (dayTasks.length > 0) {
        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'day-tasks';
        
        dayTasks.forEach(task => {
          const taskElement = document.createElement('div');
          taskElement.className = `task-item-calendar ${task.priority} ${task.completed ? 'completed' : ''}`;
          
          // Add reminder indicator if task has reminder
          const reminderDot = task.reminder ? '<i class="fas fa-bell reminder-dot"></i>' : '';
          
          taskElement.innerHTML = `
            <span class="task-dot ${task.priority}"></span>
            ${reminderDot} ${task.title}
          `;
          tasksContainer.appendChild(taskElement);
        });
        
        dayElement.appendChild(tasksContainer);
      }
      
      calendarGrid.appendChild(dayElement);
    }
  }

  // Toggle task completion
  async function toggleComplete(e) {
    const taskId = e.currentTarget.dataset.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex !== -1) {
      const newCompletedState = !tasks[taskIndex].completed;
      tasks[taskIndex].completed = newCompletedState;
      
      try {
        await db.collection('tasks').doc(taskId).update({
          completed: newCompletedState
        });
        
        renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
        renderCalendar(currentMonth, currentYear);
        updateAnalytics();
      } catch (error) {
        console.error("Error updating task:", error);
      }
    }
  }

  // Delete task function
  async function deleteTask(e) {
    const taskId = e.currentTarget.dataset.id;
    
    try {
      await db.collection('tasks').doc(taskId).delete();
      tasks = tasks.filter(task => task.id !== taskId);
      
      renderTasks(document.querySelector('.filter-btn.active').dataset.filter);
      renderCalendar(currentMonth, currentYear);
      updateAnalytics();
    } catch (error) {
      console.error("Error deleting task:", error);
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
      window.location.href = 'login.html';
    });
  });

  document.querySelector('.sidebar').appendChild(logoutBtn);
});
