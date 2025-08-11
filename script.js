class ClassicTodoList {
            constructor() {
                this.tasks = JSON.parse(localStorage.getItem('classicTodoTasks')) || [];
                this.currentFilter = 'all';
                this.currentTheme = localStorage.getItem('todoTheme') || 'urban';
                this.userName = localStorage.getItem('todoUserName') || null;
                this.notificationPermission = false;
                
                this.emojiMap = {
                    'meeting': '🤝', 'call': '📞', 'email': '📧', 'presentation': '📊',
                    'gym': '🏋️‍♀️', 'workout': '💪', 'exercise': '🏃‍♂️', 'run': '🏃‍♀️',
                    'shopping': '🛒', 'buy': '🛍️', 'grocery': '🥕', 'market': '🏪',
                    'cook': '👨‍🍳', 'recipe': '📝', 'dinner': '🍽️', 'lunch': '🥪',
                    'work': '💼', 'project': '📋', 'deadline': '⏰', 'report': '📄',
                    'study': '📚', 'learn': '🎓', 'read': '📖', 'course': '🎯',
                    'travel': '✈️', 'trip': '🧳', 'vacation': '🏖️', 'flight': '🛫',
                    'doctor': '👩‍⚕️', 'appointment': '📅', 'health': '🏥', 'medicine': '💊',
                    'birthday': '🎂', 'party': '🎉', 'celebration': '🎊', 'gift': '🎁',
                    'clean': '🧹', 'laundry': '👕', 'organize': '📦', 'tidy': '🏠'
                };
                
                this.initializeApp();
            }

            async initializeApp() {
                // Request notification permission
                if ('Notification' in window) {
                    const permission = await Notification.requestPermission();
                    this.notificationPermission = permission === 'granted';
                }
                
                this.initializeEventListeners();
                this.setTheme(this.currentTheme);
                this.checkUserName();
                this.renderTasks();
                this.updateCounter();
                this.startDueTimeChecker();
            }

            checkUserName() {
                if (!this.userName) {
                    document.getElementById('welcomeModal').style.display = 'flex';
                } else {
                    this.updateGreeting();
                }
            }

            saveName() {
                const nameInput = document.getElementById('nameInput');
                const name = nameInput.value.trim();
                
                if (name) {
                    this.userName = name;
                    localStorage.setItem('todoUserName', name);
                    document.getElementById('welcomeModal').style.display = 'none';
                    this.updateGreeting();
                    this.showNotification(`Welcome, ${name}! Let's get organized! ✨`);
                }
            }

            updateGreeting() {
                const greeting = document.getElementById('greeting');
                const hour = new Date().getHours();
                let timeGreeting = 'Hello';
                
                if (hour < 12) timeGreeting = 'Good morning';
                else if (hour < 17) timeGreeting = 'Good afternoon';
                else timeGreeting = 'Good evening';
                
                greeting.textContent = `${timeGreeting}, ${this.userName}!`;
            }

            initializeEventListeners() {
                document.getElementById('taskForm').addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.addTask();
                });

                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        this.setFilter(e.target.dataset.filter);
                    });
                });

                // Close modal on outside click
                document.getElementById('welcomeModal').addEventListener('click', (e) => {
                    if (e.target.id === 'welcomeModal') {
                        e.stopPropagation();
                    }
                });
            }

            addTask() {
                const taskInput = document.getElementById('taskInput');
                const dueDateInput = document.getElementById('dueDateInput');
                
                const taskText = taskInput.value.trim();
                if (!taskText) return;

                const emoji = this.detectEmoji(taskText);
                const finalText = emoji ? `${emoji} ${taskText}` : taskText;

                const newTask = {
                    id: Date.now(),
                    text: finalText,
                    originalText: taskText,
                    completed: false,
                    dueDate: dueDateInput.value || null,
                    createdAt: new Date().toISOString()
                };

                this.tasks.unshift(newTask);
                this.saveTasks();
                this.renderTasks();
                this.updateCounter();
                
                taskInput.value = '';
                dueDateInput.value = '';
                
                this.showNotification('Task added successfully! 📝');
            }

            detectEmoji(text) {
                const lowerText = text.toLowerCase();
                for (const [keyword, emoji] of Object.entries(this.emojiMap)) {
                    if (lowerText.includes(keyword)) {
                        return emoji;
                    }
                }
                return null;
            }

            toggleTask(taskId) {
                const task = this.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = !task.completed;
                    task.completedAt = task.completed ? new Date().toISOString() : null;
                    this.saveTasks();
                    this.renderTasks();
                    this.updateCounter();
                    
                    const message = task.completed ? 'Task completed! Well done! ✅' : 'Task marked as active! 📋';
                    this.showNotification(message);
                }
            }

            deleteTask(taskId) {
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                    taskElement.style.animation = 'slideOut 0.3s ease-in forwards';
                    setTimeout(() => {
                        this.tasks = this.tasks.filter(t => t.id !== taskId);
                        this.saveTasks();
                        this.renderTasks();
                        this.updateCounter();
                    }, 300);
                }
                this.showNotification('Task deleted! 🗑️');
            }

            setFilter(filter) {
                this.currentFilter = filter;
                
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active', 'bg-amber-100', 'border-amber-300');
                    btn.classList.add('bg-white', 'border-amber-200');
                });
                
                const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
                activeBtn.classList.remove('bg-white', 'border-amber-200');
                activeBtn.classList.add('active', 'bg-amber-100', 'border-amber-300');
                
                this.renderTasks();
            }

            getFilteredTasks() {
                switch (this.currentFilter) {
                    case 'active':
                        return this.tasks.filter(t => !t.completed);
                    case 'completed':
                        return this.tasks.filter(t => t.completed);
                    default:
                        return this.tasks;
                }
            }

            renderTasks() {
                const tasksList = document.getElementById('tasksList');
                const emptyState = document.getElementById('emptyState');
                
                const filteredTasks = this.getFilteredTasks();
                
                if (filteredTasks.length === 0) {
                    tasksList.style.display = 'none';
                    emptyState.style.display = 'block';
                } else {
                    tasksList.style.display = 'block';
                    emptyState.style.display = 'none';
                }

                tasksList.innerHTML = filteredTasks.map(task => {
                    const dueInfo = this.getDueInfo(task);
                    const taskClass = this.getTaskClass(task);
                    
                    return `
                        <div class="task-item p-6 hover:bg-gray-50 transition-all duration-200 ${taskClass}" data-task-id="${task.id}">
                            <div class="flex items-start gap-4">
                                <button 
                                    class="checkbox w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-amber-500 transition-all mt-1 ${task.completed ? 'bg-green-500 border-green-500' : ''}"
                                    onclick="todoApp.toggleTask(${task.id})"
                                >
                                    ${task.completed ? '<span class="text-white text-sm">✓</span>' : ''}
                                </button>
                                
                                <div class="flex-1">
                                    <div class="text-gray-800 text-lg ${task.completed ? 'line-through opacity-60' : ''}">${task.text}</div>
                                    ${dueInfo ? `<div class="text-sm text-gray-500 mt-1">${dueInfo}</div>` : ''}
                                    ${task.completed && task.completedAt ? `<div class="text-xs text-green-600 mt-1">Completed ${new Date(task.completedAt).toLocaleDateString()}</div>` : ''}
                                </div>
                                
                                <button 
                                    class="delete-btn text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-all"
                                    onclick="todoApp.deleteTask(${task.id})"
                                    title="Delete task"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            getDueInfo(task) {
                if (!task.dueDate) return null;
                
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                const diffMs = dueDate - now;
                const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
                
                if (diffMs < 0) {
                    return `⚠️ Overdue by ${Math.abs(diffHours)} hours`;
                } else if (diffHours <= 24) {
                    return `⏰ Due in ${diffHours} hours`;
                } else {
                    return `📅 Due ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                }
            }

            getTaskClass(task) {
                if (!task.dueDate || task.completed) return '';
                
                const dueDate = new Date(task.dueDate);
                const now = new Date();
                const diffMs = dueDate - now;
                const diffHours = diffMs / (1000 * 60 * 60);
                
                if (diffMs < 0) return 'overdue';
                if (diffHours <= 24) return 'due-soon';
                return '';
            }

            updateCounter() {
                const activeTasks = this.tasks.filter(t => !t.completed).length;
                const counter = document.getElementById('taskCounter');
                counter.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} remaining`;
            }

            startDueTimeChecker() {
                setInterval(() => {
                    this.checkDueTasks();
                }, 60000); // Check every minute
            }

            checkDueTasks() {
                if (!this.notificationPermission) return;
                
                const now = new Date();
                this.tasks.forEach(task => {
                    if (task.dueDate && !task.completed && !task.notified) {
                        const dueDate = new Date(task.dueDate);
                        const diffMs = dueDate - now;
                        const diffMinutes = diffMs / (1000 * 60);
                        
                        if (diffMinutes <= 15 && diffMinutes > 0) {
                            new Notification('Task Reminder', {
                                body: `"${task.originalText}" is due in ${Math.ceil(diffMinutes)} minutes!`,
                                icon: '📋'
                            });
                            task.notified = true;
                            this.saveTasks();
                        }
                    }
                });
            }

            setTheme(theme) {
                this.currentTheme = theme;
                localStorage.setItem('todoTheme', theme);
                
                const body = document.body;
                body.className = body.className.replace(/theme-\w+/, '');
                body.classList.add(`theme-${theme}`);
                
                this.updateBackgroundAnimations();
                
                const themeMessages = {
                    enchanted: 'Switched to Enchanted Theme! 🦋',
                    urban: 'Switched to Urban Style Theme! 🕶️'
                };
                
                this.showNotification(themeMessages[theme]);
            }

            updateBackgroundAnimations() {
                const container = document.getElementById('backgroundAnimations');
                container.innerHTML = '';
                
                if (this.currentTheme === 'enchanted') {
                    // Add sparkles
                    for (let i = 0; i < 8; i++) {
                        const sparkle = document.createElement('div');
                        sparkle.className = 'enchanted-sparkle';
                        sparkle.textContent = '✨';
                        sparkle.style.left = Math.random() * 100 + '%';
                        sparkle.style.top = Math.random() * 100 + '%';
                        sparkle.style.animationDelay = Math.random() * 2 + 's';
                        container.appendChild(sparkle);
                    }
                    
                    // Add butterflies
                    for (let i = 0; i < 4; i++) {
                        const butterfly = document.createElement('div');
                        butterfly.className = 'enchanted-butterfly';
                        butterfly.textContent = '🦋';
                        butterfly.style.left = Math.random() * 80 + '%';
                        butterfly.style.top = Math.random() * 80 + '%';
                        butterfly.style.animationDelay = Math.random() * 4 + 's';
                        container.appendChild(butterfly);
                    }
                    
                    // Add tulips
                    for (let i = 0; i < 6; i++) {
                        const tulip = document.createElement('div');
                        tulip.className = 'enchanted-tulip';
                        tulip.textContent = '🌷';
                        tulip.style.left = Math.random() * 90 + '%';
                        tulip.style.top = Math.random() * 90 + '%';
                        tulip.style.animationDelay = Math.random() * 3 + 's';
                        container.appendChild(tulip);
                    }
                } else if (this.currentTheme === 'urban') {
                    const urbanIcons = ['🕶️', '🏋️‍♂️', '👟', '⌚'];
                    
                    // Add floating corner icons
                    for (let i = 0; i < 6; i++) {
                        const icon = document.createElement('div');
                        icon.className = 'urban-icon';
                        icon.textContent = urbanIcons[Math.floor(Math.random() * urbanIcons.length)];
                        
                        // Position in corners and edges
                        if (i < 2) {
                            icon.style.left = Math.random() * 15 + '%';
                            icon.style.top = Math.random() * 20 + '%';
                        } else if (i < 4) {
                            icon.style.right = Math.random() * 15 + '%';
                            icon.style.top = Math.random() * 20 + '%';
                        } else {
                            icon.style.left = Math.random() * 100 + '%';
                            icon.style.bottom = Math.random() * 20 + '%';
                        }
                        
                        icon.style.animationDelay = Math.random() * 8 + 's';
                        icon.style.animationDuration = (6 + Math.random() * 4) + 's';
                        container.appendChild(icon);
                    }
                    
                    // Add subtle drifting icons
                    for (let i = 0; i < 3; i++) {
                        const driftIcon = document.createElement('div');
                        driftIcon.className = 'urban-drift';
                        driftIcon.textContent = urbanIcons[Math.floor(Math.random() * urbanIcons.length)];
                        driftIcon.style.top = (20 + Math.random() * 60) + '%';
                        driftIcon.style.animationDelay = Math.random() * 12 + 's';
                        driftIcon.style.animationDuration = (10 + Math.random() * 4) + 's';
                        container.appendChild(driftIcon);
                    }
                }
            }

            showNotification(message) {
                const notification = document.getElementById('notification');
                const notificationText = document.getElementById('notificationText');
                
                notificationText.textContent = message;
                notification.classList.add('show');
                
                setTimeout(() => {
                    notification.classList.remove('show');
                }, 3000);
            }

            saveTasks() {
                localStorage.setItem('classicTodoTasks', JSON.stringify(this.tasks));
            }
        }

        // Initialize the app
        const todoApp = new ClassicTodoList();