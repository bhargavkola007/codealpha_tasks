document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('taskInput');
    const dueDateTime = document.getElementById('dueDateTime');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskList = document.getElementById('taskList');
    const filterDay = document.getElementById('filterDay');
    
    // Load tasks from local storage
    loadTasks();
    
    // Add task event
    addTaskBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // Filter tasks by day
    filterDay.addEventListener('change', filterTasks);
    
    function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        const now = new Date();
        const dueDate = dueDateTime.value ? new Date(dueDateTime.value) : null;
        
        // Format dates
        const formattedCreated = formatDateTime(now);
        const formattedDue = dueDate ? formatDateTime(dueDate) : 'Not set';
        
        // Create task object
        const task = {
            id: Date.now(),
            text: taskText,
            created: now.toISOString(),
            due: dueDate ? dueDate.toISOString() : null,
            completed: false
        };
        
        // Create task item
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        // Add urgent/soon classes if due date is close
        if (dueDate) {
            const timeDiff = dueDate.getTime() - now.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            
            if (daysDiff < 1) {
                taskItem.classList.add('urgent');
            } else if (daysDiff < 3) {
                taskItem.classList.add('due-soon');
            }
        }
        
        taskItem.innerHTML = `
            <div class="task-header">
                <span class="task-text">${taskText}</span>
                <div class="task-time">
                    <div class="created-time">
                        <span class="time-label">Created:</span>
                        <span>${formattedCreated}</span>
                    </div>
                    <div class="due-time">
                        <span class="time-label">Due:</span>
                        <span>${formattedDue}</span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-btn complete-btn">Complete</button>
                <button class="task-btn delete-btn">Delete</button>
            </div>
        `;
        
        // Add event listeners
        taskItem.querySelector('.complete-btn').addEventListener('click', toggleTask);
        taskItem.querySelector('.delete-btn').addEventListener('click', deleteTask);
        
        taskList.appendChild(taskItem);
        
        // Clear inputs
        taskInput.value = '';
        dueDateTime.value = '';
        
        // Save to local storage
        saveTasks();
    }
    
    function toggleTask(e) {
        const taskItem = e.target.closest('.task-item');
        const taskText = taskItem.querySelector('.task-text');
        taskText.classList.toggle('completed');
        
        // Update complete button text
        const completeBtn = taskItem.querySelector('.complete-btn');
        completeBtn.textContent = taskText.classList.contains('completed') ? 'Undo' : 'Complete';
        
        // Save to local storage
        saveTasks();
    }
    
    function deleteTask(e) {
        const taskItem = e.target.closest('.task-item');
        taskItem.remove();
        
        // Save to local storage
        saveTasks();
    }
    
    function saveTasks() {
        const tasks = [];
        document.querySelectorAll('.task-item').forEach(taskItem => {
            const taskText = taskItem.querySelector('.task-text').textContent;
            const isCompleted = taskItem.querySelector('.task-text').classList.contains('completed');
            const created = taskItem.querySelector('.created-time span:last-child').textContent;
            const due = taskItem.querySelector('.due-time span:last-child').textContent;
            
            tasks.push({
                id: taskItem.dataset.id,
                text: taskText,
                created: created,
                due: due,
                completed: isCompleted
            });
        });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    function loadTasks() {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
            const tasks = JSON.parse(savedTasks);
            
            tasks.forEach(task => {
                const taskItem = document.createElement('li');
                taskItem.className = 'task-item';
                taskItem.dataset.id = task.id;
                
                // Add urgent/soon classes if due date is close
                if (task.due !== 'Not set') {
                    const dueDate = new Date(task.due);
                    const now = new Date();
                    const timeDiff = dueDate.getTime() - now.getTime();
                    const daysDiff = timeDiff / (1000 * 3600 * 24);
                    
                    if (daysDiff < 1) {
                        taskItem.classList.add('urgent');
                    } else if (daysDiff < 3) {
                        taskItem.classList.add('due-soon');
                    }
                }
                
                taskItem.innerHTML = `
                    <div class="task-header">
                        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
                        <div class="task-time">
                            <div class="created-time">
                                <span class="time-label">Created:</span>
                                <span>${task.created}</span>
                            </div>
                            <div class="due-time">
                                <span class="time-label">Due:</span>
                                <span>${task.due}</span>
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
                        <button class="task-btn delete-btn">Delete</button>
                    </div>
                `;
                
                // Add event listeners
                taskItem.querySelector('.complete-btn').addEventListener('click', toggleTask);
                taskItem.querySelector('.delete-btn').addEventListener('click', deleteTask);
                
                taskList.appendChild(taskItem);
            });
        }
    }
    
    function filterTasks() {
        const filterValue = filterDay.value;
        const now = new Date();
        const tasks = document.querySelectorAll('.task-item');
        
        tasks.forEach(task => {
            const dueText = task.querySelector('.due-time span:last-child').textContent;
            
            if (filterValue === 'all') {
                task.style.display = 'flex';
                return;
            }
            
            if (dueText === 'Not set') {
                task.style.display = 'none';
                return;
            }
            
            const dueDate = new Date(dueText);
            
            switch(filterValue) {
                case 'today':
                    if (isSameDay(now, dueDate)) {
                        task.style.display = 'flex';
                    } else {
                        task.style.display = 'none';
                    }
                    break;
                case 'tomorrow':
                    const tomorrow = new Date(now);
                    tomorrow.setDate(now.getDate() + 1);
                    if (isSameDay(tomorrow, dueDate)) {
                        task.style.display = 'flex';
                    } else {
                        task.style.display = 'none';
                    }
                    break;
                case 'week':
                    const nextWeek = new Date(now);
                    nextWeek.setDate(now.getDate() + 7);
                    if (dueDate >= now && dueDate <= nextWeek) {
                        task.style.display = 'flex';
                    } else {
                        task.style.display = 'none';
                    }
                    break;
            }
        });
    }
    
    function formatDateTime(date) {
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
});