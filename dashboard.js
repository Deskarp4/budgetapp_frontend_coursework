document.addEventListener('DOMContentLoaded', function() {
    // Получаем реальные данные для графиков
    const txs = typeof getTransactions === 'function' ? getTransactions() : [];
    const incomeDataValues = typeof getChartData === 'function' ? getChartData(txs, 'income') : [];
    const expenseDataValues = typeof getChartData === 'function' ? getChartData(txs, 'expense') : [];
    
    const budgetDataValues = [65, 59, 80, 100, 70, 20, 12,];

    function createSparkline(canvasId, dataValues) {
    const canvas = document.getElementById(canvasId);

    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: dataValues.map((_, i) => i),
            datasets: [{
                data: dataValues.map(() => 0), // ← нули, чтобы было от чего анимировать
                barThickness: 3,
                backgroundColor: (ctx) => ctx.dataIndex % 2 === 0 ? "#d4d4d4" : "#050505",
                barPercentage: 0.9,
                borderRadius: 2,
                borderSkipped: false,
            }]
        },
        options: {
            // animation: false, // ← отключаем на время инициализации
            responsive: true,
            scales: { x: { display: false }, y: { display: false } },
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            layout: { padding: { bottom: 1 } },
        },
    });

    // ResizeObserver успокоился → включаем анимацию и ставим реальные данные
    setTimeout(() => {
        chart.data.datasets[0].data = dataValues;
        chart.options.animation = { duration: 1000, easing: 'easeInOutQuart' };
        chart.update();
    }, 5);

    return chart;
    }

    function createBudgetSparkline(canvasId, dataValues) {
        const canvas = document.getElementById(canvasId);
        
        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: dataValues.map((_, index) => index),
                datasets: [
                    {
                        data: dataValues,
                        barThickness: 15,
                        backgroundColor: (context) => {return context.dataIndex % 2 == 0 ? "#d4d4d4" : "#050505";},
                        barPercentage: 1,
                        borderRadius: 3,
                        borderSkipped: false,
                    }
                ]
            },
            options: {
                responsive: true,
                scales: { x: { display: false }, y: { display: false } },
                plugins: { legend: {display: false} },
                maintainAspectRatio: false,
                layout: { padding: { bottom: 1 } },
            },
        });
    }

    function getSparklineValues(values) {
        const count = sparklineMedia.matches ? 30 : 20;
        let result = values.slice(-count); // Берем последние (самые свежие) значения
        
        // Добиваем нулями справа, если данных меньше, чем нужно колонок
        while (result.length < count) {
            result.push(0);
        }
        return result;
    }

    function updateSparkline(chart, values) {
        const visibleValues = getSparklineValues(values);
        chart.data.labels = visibleValues.map((_, index) => index);
        chart.data.datasets[0].data = visibleValues;
        chart.update();
    }

    function animateSphere() {
        if (!sphereImage) return;
        const rawExtraWidth = Math.max(window.innerWidth - baseWindowWidth, 0);
        const extraWidth = Math.min(rawExtraWidth, MAX_WIDTH - baseWindowWidth);
        const scaleProgress = clamp(extraWidth / 500, 0, 1.576);
        const targetX = extraWidth * 1.15;
        const targetScale = 1 + scaleProgress * 1;

        if (isFirstFrame) {
            currentX = targetX;
            currentScale = targetScale;
            isFirstFrame = false;
        }

        const inertia = 0.02;
        currentX += (targetX - currentX) * inertia;
        currentScale += (targetScale - currentScale) * inertia;
        sphereImage.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0) scale(${currentScale.toFixed(3)})`;
        requestAnimationFrame(animateSphere);
    }
    
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Используем безопасный синтаксис media queries для поддержки всех браузеров
    const sparklineMedia = window.matchMedia("(min-width: 1921px), (min-width: 469px) and (max-width: 640px)");

    const incomeChartEl = document.getElementById("incomeChart");
    const expenseChartEl = document.getElementById("expenseChart");
    let incomeChart = null;
    let expenseChart = null;

    if (incomeChartEl) {
        incomeChart = createSparkline("incomeChart", getSparklineValues(incomeDataValues));
    }
    if (expenseChartEl) {
        expenseChart = createSparkline("expenseChart", getSparklineValues(expenseDataValues));
    }

    sparklineMedia.addEventListener("change", () => {
        // Запрашиваем свежие данные из хранилища при перестроении графиков,
        // вместо того чтобы использовать устаревшие массивы с момента загрузки страницы
        if (typeof window.updateDashboardCharts === 'function') {
            window.updateDashboardCharts();
        }
    });

    const valueItem = document.getElementById("circleProgressAmount");
    const circle = document.querySelector(".circle-figure");
    let circleLength = 0;

    if (valueItem && circle) {
        const rawValue = valueItem.textContent;
        const value = parseFloat(rawValue.replace("%", ""));
        
        circleLength = circle.getTotalLength();
        circle.style.setProperty("stroke-dasharray", circleLength);
        circle.style.setProperty("stroke-dashoffset", circleLength);

        requestAnimationFrame(() => {
            circle.style.transition = "stroke-dashoffset 1s ease";
            circle.style.strokeDashoffset = circleLength - (circleLength * value / 100);
        });
    }

    const sphereImage = document.querySelector(".sphere-image");
    const baseWindowWidth = 1650;
    const MAX_WIDTH = 2560;
    let currentX = 0;
    let currentScale = 1;
    let isFirstFrame = true;
    

    if (sphereImage) {
        animateSphere();
    }

    // Эта функция будет вызываться каждый раз при добавлении/удалении транзакции из logic.js
    window.updateDashboardCharts = function() {
        const newTxs = typeof getTransactions === 'function' ? getTransactions() : [];
        const inc = typeof getChartData === 'function' ? getChartData(newTxs, 'income') : [];
        const exp = typeof getChartData === 'function' ? getChartData(newTxs, 'expense') : [];
        if (incomeChart) updateSparkline(incomeChart, inc);
        if (expenseChart) updateSparkline(expenseChart, exp);

        // Обновляем круговой прогресс
        const circleAmount = document.getElementById("circleProgressAmount");
        if (circleAmount && circle) {
            const val = parseFloat(circleAmount.textContent.replace("%", "")) || 0;
            circle.style.strokeDashoffset = circleLength - (circleLength * val / 100);
        }
    };

    /* --- MODALS --- */
    const addIncomeBtn = document.getElementById("addIncomeButton");
    const closeIncomeBtn = document.getElementById("closeIncomeButton");
    const addIncomeModal = document.getElementById("addIncomeModal");
    if (addIncomeBtn && closeIncomeBtn && addIncomeModal) {
        addIncomeBtn.addEventListener("click", () => {
            const dateInput = document.getElementById('incomeDate');
            if (dateInput && !dateInput.value) {
                const today = new Date();
                dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            }
            addIncomeModal.style.display = "flex";
        });
        closeIncomeBtn.addEventListener("click", () => addIncomeModal.style.display = "none");
    }

    const addExpenseBtn = document.getElementById("addExpenseButton");
    const closeExpenseBtn = document.getElementById("closeExpenseButton");
    const addExpenseModal = document.getElementById("addExpenseModal");
    if (addExpenseBtn && closeExpenseBtn && addExpenseModal) {
        addExpenseBtn.addEventListener("click", () => {
            const dateInput = document.getElementById('expenseDate');
            if (dateInput && !dateInput.value) {
                const today = new Date();
                dateInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            }
            addExpenseModal.style.display = "flex";
        });
        closeExpenseBtn.addEventListener("click", () => addExpenseModal.style.display = "none");
    }

    const setBudgetBtn = document.getElementById("setBudgetButton");
    const closeBudgetBtn = document.getElementById("closeBudgetButton");
    const setBudgetModal = document.getElementById("setBudgetModal");
    if (setBudgetBtn && closeBudgetBtn && setBudgetModal) {
        setBudgetBtn.addEventListener("click", () => {
            const settings = typeof getSettings === 'function' ? getSettings() : { budget: 0 };
            const budgetInput = document.getElementById('budgetInput');
            if (budgetInput) budgetInput.value = settings.budget;
            setBudgetModal.style.display = "flex";
        });
        closeBudgetBtn.addEventListener("click", () => setBudgetModal.style.display = "none");
    }

    const setGoalBtn = document.getElementById("setGoalButton");
    const closeGoalBtn = document.getElementById("closeGoalButton");
    const setGoalModal = document.getElementById("setGoalModal");
    if (setGoalBtn && closeGoalBtn && setGoalModal) {
        setGoalBtn.addEventListener("click", () => {
            const settings = typeof getSettings === 'function' ? getSettings() : { goal: 0 };
            const goalInput = document.getElementById('goalInput');
            if (goalInput) goalInput.value = settings.goal;
            setGoalModal.style.display = "flex";
        });
        closeGoalBtn.addEventListener("click", () => setGoalModal.style.display = "none");
    }

    // Закрытие модальных окон при клике вне их области (на прозрачный/размытый фон)
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    });
});