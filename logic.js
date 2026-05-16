const STORAGE_KEY = 'monyx_transactions';

// Стартовые данные для LocalStorage, чтобы приложение не было пустым при первом запуске
const defaultTransactions = [
    { id: "1716541200000", date: "2024-05-24T09:00:00.000Z", description: "Salary Payment", category: "salary", type: "income", amount: 6000.00, status: "Completed" },
    { id: "1716454800000", date: "2024-05-23T09:00:00.000Z", description: "Dribbble Pro", category: "software", type: "expense", amount: 12.00, status: "Completed" },
    { id: "1716368400000", date: "2024-05-22T09:00:00.000Z", description: "Uber Ride", category: "transport", type: "expense", amount: 18.50, status: "Completed" },
    { id: "1716382800000", date: "2024-05-22T13:00:00.000Z", description: "Grocery Shopping", category: "food", type: "expense", amount: 64.25, status: "Completed" },
    { id: "1716282000000", date: "2024-05-21T09:00:00.000Z", description: "Freelance Project", category: "freelance", type: "income", amount: 1250.00, status: "Completed" }
];

// Чтение из LocalStorage
window.getTransactions = function() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTransactions));
        return defaultTransactions;
    }
    return JSON.parse(saved);
};

// Сохранение в LocalStorage + Триггер обновления всего интерфейса
window.saveTransactions = function(transactions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    updateUI();
};

// Добавление новой операции
window.addTransaction = function(type, amount, description, category) {
    const txs = getTransactions();
    txs.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        description,
        category,
        type,
        amount: parseFloat(amount),
        status: "Completed"
    });
    saveTransactions(txs);
};

// Удаление операции
window.deleteTransaction = function(id) {
    let txs = getTransactions();
    txs = txs.filter(t => t.id !== id);
    saveTransactions(txs);
};

// Утилиты для форматирования
function formatCurrency(amount) {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Управление настройками: Бюджет и Цель (Goal)
window.getSettings = function() {
    const saved = localStorage.getItem('monyx_settings');
    return saved ? JSON.parse(saved) : { goal: 50000, budget: 10080 };
};

window.saveSettings = function(settings) {
    localStorage.setItem('monyx_settings', JSON.stringify(settings));
    updateUI();
};

// Подготовка данных для sparkline-графиков (Dashboard)
window.getChartData = function(transactions, type) {
    // Берем транзакции нужного типа и сортируем хронологически: старые слева, новые (последние) справа
    const sorted = [...transactions]
        .filter(t => t.type === type)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
        
    let data = sorted.map(t => t.amount);
    if (data.length === 0) return [0, 0, 0, 0, 0];
    data = data.slice(-30); // Берем последние 30 значений
    while(data.length < 10) data.unshift(0); // Заполняем нулями для визуала, если транзакций мало
    return data;
};

// Подготовка данных для графика баланса по ДНЯМ (Сайдбар)
window.getBalanceHistory = function(transactions) {
    const sorted = [...transactions].sort((a,b) => new Date(a.date) - new Date(b.date));
    const daily = {};
    let bal = 0;
    sorted.forEach(t => {
        bal += (t.type === 'income' ? t.amount : -t.amount);
        const day = t.date.split('T')[0];
        daily[day] = bal; // Перезаписываем баланс для каждого дня, сохраняя итог на конец суток
    });
    
    let data = Object.values(daily);
    if (data.length === 0) return [0, 0, 0, 0, 0];
    data = data.slice(-30);
    while(data.length < 10) data.unshift(data[0] || 0);
    return data;
};

// ГЛАВНАЯ ФУНКЦИЯ: Обновление всех чисел и таблиц на экране
function updateUI() {
    const txs = getTransactions();
    const settings = getSettings();
    
    // 1. Вычисления (Математика)
    const income = txs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    
    // 2. Обновление главных балансов
    document.querySelectorAll('.balance-card_amount, .sidebar-card_balance').forEach(el => el.textContent = formatCurrency(balance));
    
    const incEl = document.querySelector('.income-card .amount');
    if (incEl) incEl.textContent = formatCurrency(income);
    
    const expEl = document.querySelector('.expense-card .amount');
    if (expEl) expEl.textContent = formatCurrency(expense);
    
    // 3. Обновление карточки Total Balance (Прогресс бары)
    const stats = document.querySelectorAll('.stats-row .stat strong');
    if (stats.length === 3) {
        stats[0].textContent = formatCurrency(income);
        stats[1].textContent = formatCurrency(expense);
        stats[2].textContent = `${Math.max(0, savingsRate)}%`;
    }
    const balProgress = document.querySelectorAll('.balance-card_progress .progress-bar_value');
    if (balProgress.length === 3) {
        // Income бар: Показываем достижение цели (Goal)
        balProgress[0].style.width = `${Math.min(100, Math.round((income / settings.goal) * 100))}%`;
        // Expense бар: Дублирует круговой график бюджета (Budget)
        balProgress[1].style.width = `${Math.min(100, Math.round((expense / settings.budget) * 100))}%`;
        // Savings rate бар
        balProgress[2].style.width = `${Math.max(0, savingsRate)}%`;
    }

    // 4. Обновление карточки бюджета
    const BUDGET_TOTAL = settings.budget; 
    const remaining = Math.max(0, BUDGET_TOTAL - expense);
    const usedPercent = Math.min(100, Math.round((expense / BUDGET_TOTAL) * 100));
    
    const budgetAmounts = document.querySelector('.budget-amounts');
    if (budgetAmounts) {
        budgetAmounts.innerHTML = `
            <div><strong>${formatCurrency(BUDGET_TOTAL)}</strong><p class="label-mini">Total budget</p></div>
            <div><strong>${formatCurrency(remaining)}</strong><p class="label-mini">Remaining</p></div>
            <div><strong>${formatCurrency(expense)}</strong><p class="label-mini">Spent</p></div>
        `;
    }
    const circleAmount = document.getElementById('circleProgressAmount');
    if (circleAmount) circleAmount.textContent = `${usedPercent}%`;

    // 5. Рендер списков ТОП категорий
    renderTopList('income', '.income-card .stats');
    renderTopList('expense', '.expense-card .stats');

    // 6. Обновление таблиц и графиков (Charts)
    renderTables(txs);
    if (typeof window.updateDashboardCharts === 'function') window.updateDashboardCharts();
    if (typeof window.updateSidebarCharts === 'function') window.updateSidebarCharts();
}

// Генерация ТОП-3 категорий
function renderTopList(type, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    
    const txs = getTransactions().filter(t => t.type === type);
    const totals = {};
    txs.forEach(t => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    const sorted = Object.entries(totals).sort((a,b) => b[1] - a[1]).slice(0,3);
    const max = sorted[0] ? sorted[0][1] : 1; 
    
    let html = '';
    sorted.forEach(([cat, amt]) => {
        const percent = Math.round((amt / max) * 100);
        const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
        html += `
            <div class="top-row">
                <div class="top-row_part"><span>${catName}</span><span>${formatCurrency(amt)}</span></div>
                <div class="progress-bar cashflow-card_progress">
                    <div class="progress-bar_value" style="width: ${percent}%;"></div>
                </div>
            </div>`;
    });
    container.innerHTML = html;
}

// Генерация Таблиц
function renderTables(txs) {
    const sortedTxs = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const dashTbody = document.querySelector('.dashboard-table tbody');
    if (dashTbody) dashTbody.innerHTML = sortedTxs.slice(0, 5).map(t => generateRowHTML(t, false)).join(''); // На дашборде 5 штук
    
    const fullTbody = document.querySelector('.transactions-list-table tbody');
    if (fullTbody) fullTbody.innerHTML = sortedTxs.map(t => generateRowHTML(t, true)).join(''); // На странице транзакций - все
}

function generateRowHTML(t, showDelete) {
    const icon = t.type === 'income' ? 'assets/transactions_plus.svg' : 'assets/transactions_minus.svg';
    const catName = t.category.charAt(0).toUpperCase() + t.category.slice(1);
    return `
        <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${catName}</td>
            <td><img src="${icon}" width="12px" height="12px"></td>
            <td>${formatCurrency(t.amount)}</td>
            <td>● ${t.status}
                ${showDelete ? `<button class="delete-row-button" data-id="${t.id}"><img src="assets/trash.svg"></button>` : ''}
            </td>
        </tr>`;
}

// Инициализация событий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateUI(); // Первый рендер всего интерфейса

    // Обработка кнопки добавления дохода
    const submitIncomeBtn = document.getElementById('submitIncomeBtn');
    if (submitIncomeBtn) {
        submitIncomeBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('incomeInput').value);
            const desc = document.getElementById('incomeDescription').value.trim();
            const cat = document.getElementById('incomeCategory').value;
            if (!amount || amount <= 0 || !desc) return alert('Please enter a valid amount and description.');
            
            addTransaction('income', amount, desc, cat);
            document.getElementById('addIncomeModal').style.display = 'none';
            document.getElementById('incomeInput').value = ''; document.getElementById('incomeDescription').value = '';
        });
    }
    
    // Обработка кнопки добавления расхода
    const submitExpenseBtn = document.getElementById('submitExpenseBtn');
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('expenseInput').value);
            const desc = document.getElementById('expenseDescription').value.trim();
            const cat = document.getElementById('expenseCategory').value;
            if (!amount || amount <= 0 || !desc) return alert('Please enter a valid amount and description.');
            
            addTransaction('expense', amount, desc, cat);
            document.getElementById('addExpenseModal').style.display = 'none';
            document.getElementById('expenseInput').value = ''; document.getElementById('expenseDescription').value = '';
        });
    }
    
    // Обработка кнопки "Set Budget"
    const setBudgetBtn = document.getElementById('setBudgetButton');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            const settings = getSettings();
            const newBudget = prompt('Enter new monthly budget:', settings.budget);
            if (newBudget !== null && !isNaN(newBudget) && newBudget > 0) {
                settings.budget = parseFloat(newBudget);
                saveSettings(settings);
            }
        });
    }

    // Обработка кнопки "New Goal"
    const setGoalBtn = document.getElementById('setGoalButton');
    if (setGoalBtn) {
        setGoalBtn.addEventListener('click', () => {
            const settings = getSettings();
            const newGoal = prompt('Enter new income goal:', settings.goal);
            if (newGoal !== null && !isNaN(newGoal) && newGoal > 0) {
                settings.goal = parseFloat(newGoal);
                saveSettings(settings);
            }
        });
    }

    // Обработка клика по кнопке удаления (Делегирование событий)
    document.body.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-row-button');
        if (deleteBtn) deleteTransaction(deleteBtn.dataset.id);
    });
});