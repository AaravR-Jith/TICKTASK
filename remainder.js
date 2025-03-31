document.addEventListener("DOMContentLoaded", loadTasks);

document.getElementById("taskForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let task = document.getElementById("task").value;
    let date = document.getElementById("date").value;
    let time = document.getElementById("time").value;

    if (!task || !date || !time) {
        alert("Please fill in all fields!");
        return;
    }

    let taskTime = new Date(`${date}T${time}:00`).getTime();
    let currentTime = new Date().getTime();
    let timeDiff = taskTime - currentTime;

    if (timeDiff <= 0) {
        alert("Selected time must be in the future!");
        return;
    }

    let newTask = { task, date, time, taskTime };

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.push(newTask);
    localStorage.setItem("tasks", JSON.stringify(tasks));

    addTaskToDOM(newTask);
    alert("Task Added Successfully!");

    setTimeout(() => {
        showNotification(task);
    }, timeDiff);
});

function addTaskToDOM(taskObj) {
    let taskList = document.getElementById("taskList");
    let li = document.createElement("li");

    let countdown = document.createElement("span");
    countdown.classList.add("countdown");
    updateCountdown(taskObj.taskTime, countdown);
    setInterval(() => updateCountdown(taskObj.taskTime, countdown), 1000);

    li.innerHTML = `<strong>${taskObj.task}</strong> - ${taskObj.date} ${taskObj.time}`;
    li.appendChild(countdown);

    let deleteBtn = document.createElement("button");
    deleteBtn.textContent = "❌";
    deleteBtn.classList.add("delete-btn");
    deleteBtn.onclick = () => deleteTask(taskObj.task, taskObj.date, taskObj.time);

    li.appendChild(deleteBtn);
    taskList.appendChild(li);
}

function deleteTask(task, date, time) {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks = tasks.filter(t => !(t.task === task && t.date === date && t.time === time));

    localStorage.setItem("tasks", JSON.stringify(tasks));
    loadTasks();
}

function loadTasks() {
    let taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    tasks.forEach(task => {
        addTaskToDOM(task);
        
        let currentTime = new Date().getTime();
        let timeDiff = task.taskTime - currentTime;
        if (timeDiff > 0) {
            setTimeout(() => {
                showNotification(task.task);
            }, timeDiff);
        }
    });
}

function showNotification(task) {
    if ("Notification" in window) {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Task Reminder", {
                    body: `Reminder: ${task}`,
                    icon: "https://cdn-icons-png.flaticon.com/512/310/310693.png"
                });
            }
        });
    } else {
        alert(`Reminder: ${task}`);
    }
}

function updateCountdown(taskTime, countdownElem) {
    let now = new Date().getTime();
    let diff = taskTime - now;

    if (diff <= 0) {
        countdownElem.textContent = "🔔 Time's up!";
        return;
    }

    let minutes = Math.floor(diff / (1000 * 60));
    countdownElem.textContent = `⏳ ${minutes} min left`;
}