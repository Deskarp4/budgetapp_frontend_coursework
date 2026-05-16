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
window.addTransaction = function(type, amount, description, category, dateStr) {
    const txs = getTransactions();
    let date = new Date().toISOString();
    if (dateStr) {
        const [year, month, day] = dateStr.split('-');
        const d = new Date();
        d.setFullYear(year, month - 1, day);
        date = d.toISOString();
    }
    txs.push({
        id: Date.now().toString(),
        date: date,
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
    return saved ? JSON.parse(saved) : { goal: 0, budget: 0 };
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
    return data.slice(-30); // Просто возвращаем до 30 последних значений без добивки
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
        stats[0].textContent = formatCurrency(settings.goal);
        stats[1].textContent = formatCurrency(expense);
        stats[2].textContent = `${Math.max(0, savingsRate)}%`;
    }
    const balProgress = document.querySelectorAll('.balance-card_progress .progress-bar_value');
    if (balProgress.length === 3) {
        // Income бар: Показываем достижение цели (Goal)
        balProgress[0].style.width = `${settings.goal > 0 ? Math.min(100, Math.round((income / settings.goal) * 100)) : 0}%`;
        // Expense бар: Дублирует круговой график бюджета (Budget)
        balProgress[1].style.width = `${settings.budget > 0 ? Math.min(100, Math.round((expense / settings.budget) * 100)) : 0}%`;
        // Savings rate бар
        balProgress[2].style.width = `${Math.max(0, savingsRate)}%`;
    }

    // Расчет трендов (показателей from last month)
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let incCurr = 0, incPrev = 0, expCurr = 0, expPrev = 0;

    txs.forEach(t => {
        const d = new Date(t.date);
        const m = d.getMonth();
        const y = d.getFullYear();
        if (y === currentYear && m === currentMonth) {
            if (t.type === 'income') incCurr += t.amount;
            else expCurr += t.amount;
        } else if (y === prevYear && m === prevMonth) {
            if (t.type === 'income') incPrev += t.amount;
            else expPrev += t.amount;
        }
    });

    const balCurr = incCurr - expCurr;
    const balPrev = incPrev - expPrev;

    function calcTrend(curr, prev) {
        if (prev === 0) return curr > 0 ? 100 : (curr < 0 ? -100 : 0);
        return ((curr - prev) / Math.abs(prev)) * 100;
    }

    function updateTrendUI(prefix, trendValue) {
        const iconEl = document.getElementById(`${prefix}TrendIcon`);
        const textEl = document.getElementById(`${prefix}TrendText`);
        if (!iconEl || !textEl) return;
        const absValue = Math.abs(trendValue);
        const isPositive = trendValue >= 0 || absValue < 0.05; // Избегаем отрицательного нуля (-0.0%)
        const sign = isPositive ? '+' : '-';
        const valueStr = absValue.toFixed(1).replace('.0', '');
        textEl.textContent = `${sign}${valueStr}% from last month`;
        iconEl.src = isPositive ? 'assets/arrow_up.svg' : 'assets/arrow_down.svg';
    }

    updateTrendUI('balance', calcTrend(balCurr, balPrev));
    updateTrendUI('income', calcTrend(incCurr, incPrev));
    updateTrendUI('expense', calcTrend(expCurr, expPrev));

    // 4. Обновление карточки бюджета
    const BUDGET_TOTAL = settings.budget; 
    const remaining = Math.max(0, BUDGET_TOTAL - expense);
    const usedPercent = BUDGET_TOTAL > 0 ? Math.min(100, Math.round((expense / BUDGET_TOTAL) * 100)) : 0;
    
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

const emptyTableMessage = document.getElementById("empty-table-message");
const emptyIncomesMessage = document.getElementById("empty-income-message");
const emptyExpensesMessage = document.getElementById("empty-expense-message");
const emptyTransactionsPageTableMessage = document.getElementById("empty-transactions-page-table-message");

let currentSortColumn = 'date';
let currentSortDirection = 'desc';

// Генерация Таблиц
function renderTables(txs) {
    const sortedTxs = [...txs].sort((a, b) => {
        if (!currentSortColumn) {
            // Сортировка по умолчанию (по убыванию даты)
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        }

        let valA = a[currentSortColumn];
        let valB = b[currentSortColumn];

        if (currentSortColumn === 'date') {
            valA = new Date(valA).getTime();
            valB = new Date(valB).getTime();
        } else if (currentSortColumn === 'amount') {
            valA = parseFloat(valA);
            valB = parseFloat(valB);
        } else {
            valA = valA ? valA.toString().toLowerCase() : '';
            valB = valB ? valB.toString().toLowerCase() : '';
        }

        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    const dashTbody = document.querySelector('.dashboard-table tbody');
    if (dashTbody) dashTbody.innerHTML = sortedTxs.slice(0, 5).map(t => generateRowHTML(t, false)).join(''); // На дашборде 5 штук
    
    const fullTbody = document.querySelector('.transactions-list-table tbody');
    if (fullTbody) fullTbody.innerHTML = sortedTxs.map(t => generateRowHTML(t, true)).join(''); // На странице транзакций - все

    // Обновляем визуальное отображение стрелочек
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === currentSortColumn && currentSortDirection) {
            th.classList.add(`sort-${currentSortDirection}`);
        }
    });

    if (emptyTableMessage) emptyTableMessage.style.display = sortedTxs.length === 0 ? "block" : "none"; 
    if (emptyTransactionsPageTableMessage) emptyTransactionsPageTableMessage.style.display = sortedTxs.length === 0 ? "block" : "none"; 
    if (emptyIncomesMessage) emptyIncomesMessage.style.display = txs.some(t => t.type === 'income') ? "none" : "block"; 
    if (emptyExpensesMessage) emptyExpensesMessage.style.display = txs.some(t => t.type === 'expense') ? "none" : "block"; 
    
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

// Обновление таймера "Reset in" до конца текущего месяца
function updateResetTimer() {
    const timeEl = document.getElementById('resetTimerText');
    if (!timeEl) return;

    const now = new Date();
    // Создаем дату 1-го числа следующего месяца (00:00:00)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diffMs = endOfMonth - now;

    if (diffMs <= 0) {
        timeEl.textContent = "00D : 00H : 00M";
        return;
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diffMs / 1000 / 60) % 60);

    timeEl.textContent = `${String(days).padStart(2, '0')}D : ${String(hours).padStart(2, '0')}H : ${String(mins).padStart(2, '0')}M`;
}

// Инициализация событий при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    updateUI(); // Первый рендер всего интерфейса
    updateResetTimer(); // Первый рендер таймера
    setInterval(updateResetTimer, 1000); // Запуск обновления таймера каждую секунду

    // Обработка кнопки добавления дохода
    const submitIncomeBtn = document.getElementById('submitIncomeBtn');
    if (submitIncomeBtn) {
        submitIncomeBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('incomeInput').value);
            let desc = document.getElementById('incomeDescription').value.trim();
            const cat = document.getElementById('incomeCategory').value;
            const dateVal = document.getElementById('incomeDate').value;
            if (!amount || amount <= 0) return alert('Please enter a valid amount.');
            
            desc = desc ? desc.substring(0, 50) : 'None';

            addTransaction('income', amount, desc, cat, dateVal);
            document.getElementById('addIncomeModal').style.display = 'none';
            document.getElementById('incomeInput').value = ''; 
            document.getElementById('incomeDescription').value = '';
            document.getElementById('incomeDate').value = '';
        });
    }
    
    // Обработка кнопки добавления расхода
    const submitExpenseBtn = document.getElementById('submitExpenseBtn');
    if (submitExpenseBtn) {
        submitExpenseBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('expenseInput').value);
            let desc = document.getElementById('expenseDescription').value.trim();
            const cat = document.getElementById('expenseCategory').value;
            const dateVal = document.getElementById('expenseDate').value;
            if (!amount || amount <= 0) return alert('Please enter a valid amount.');
            
            desc = desc ? desc.substring(0, 50) : 'None';

            addTransaction('expense', amount, desc, cat, dateVal);
            document.getElementById('addExpenseModal').style.display = 'none';
            document.getElementById('expenseInput').value = ''; 
            document.getElementById('expenseDescription').value = '';
            document.getElementById('expenseDate').value = '';
        });
    }
    
    // Обработка сохранения бюджета
    const submitBudgetBtn = document.getElementById('submitBudgetBtn');
    if (submitBudgetBtn) {
        submitBudgetBtn.addEventListener('click', () => {
            const settings = getSettings();
            const newBudget = parseFloat(document.getElementById('budgetInput').value);
            if (!isNaN(newBudget) && newBudget > 0) {
                settings.budget = newBudget;
                saveSettings(settings);
                document.getElementById('setBudgetModal').style.display = 'none';
            } else {
                alert('Please enter a valid budget amount.');
            }
        });
    }

    // Обработка сохранения цели
    const submitGoalBtn = document.getElementById('submitGoalBtn');
    if (submitGoalBtn) {
        submitGoalBtn.addEventListener('click', () => {
            const settings = getSettings();
            const newGoal = parseFloat(document.getElementById('goalInput').value);
            if (!isNaN(newGoal) && newGoal > 0) {
                settings.goal = newGoal;
                saveSettings(settings);
                document.getElementById('setGoalModal').style.display = 'none';
            } else {
                alert('Please enter a valid goal amount.');
            }
        });
    }

    // Обработка клика по кнопке удаления (Делегирование событий)
    document.body.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-row-button');
        if (deleteBtn) deleteTransaction(deleteBtn.dataset.id);
    });

    // Обработка клика по заголовкам таблиц для сортировки
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sort;
            const initialDir = (sortKey === 'date' || sortKey === 'amount') ? 'desc' : 'asc';
            
            if (currentSortColumn === sortKey) {
                if (currentSortDirection === initialDir) {
                    // Второй клик: меняем направление
                    currentSortDirection = initialDir === 'asc' ? 'desc' : 'asc';
                } else {
                    // Третий клик: сбрасываем сортировку
                    currentSortColumn = null;
                    currentSortDirection = null;
                }
            } else {
                currentSortColumn = sortKey;
                currentSortDirection = initialDir;
            }
            updateUI(); // Перерисовываем весь UI с новой сортировкой
        });
    });
});