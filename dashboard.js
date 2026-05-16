document.addEventListener('DOMContentLoaded', function() {
    const incomeDataValues = [
        20, 70, 15, 30, 12, 18, 40, 10, 5, 50,
        20, 70, 15, 30, 12, 18, 40, 10, 5, 50,
        35, 22, 64, 18, 44, 28, 76, 12, 38, 55
    ];

    const expenseDataValues = [
        20, 50, 15, 30, 35, 18, 70, 10, 5, 50,
        20, 70, 15, 30, 12, 18, 40, 10, 5, 50,
        24, 60, 18, 42, 31, 12, 68, 26, 40, 16
    ];
    
    const budgetDataValues = [65, 59, 80, 100, 70, 20, 12,];

    function createSparkline(canvasId, dataValues) {
    const canvas = document.getElementById(canvasId);
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 40;

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
        return values.slice(0, count);
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


    const originalUpdate = Chart.prototype.update;
Chart.prototype.update = function(...args) {
    console.trace('UPDATE called:', args);
    return originalUpdate.apply(this, args);
};

const originalResize = Chart.prototype.resize;
Chart.prototype.resize = function(...args) {
    console.trace('RESIZE called');
    return originalResize.apply(this, args);
};


    const sparklineMedia = window.matchMedia("(width > 1920px) or ((width > 468px) and (width < 641px))");

    const incomeChart = createSparkline("incomeChart", getSparklineValues(incomeDataValues));
    const expenseChart = createSparkline("expenseChart", getSparklineValues(expenseDataValues));

    sparklineMedia.addEventListener("change", () => {
        updateSparkline(incomeChart, incomeDataValues);
        updateSparkline(expenseChart, expenseDataValues);
    });

    const valueItem = document.getElementById("circleProgressAmount");
    const rawValue = valueItem.textContent;
    const value = parseFloat(rawValue.replace("%", ""));
    
    const circle = document.querySelector(".circle-figure");
    const circleLength = circle.getTotalLength();
    circle.style.setProperty("stroke-dasharray", circleLength);
    circle.style.setProperty("stroke-dashoffset", circleLength);

    requestAnimationFrame(() => {
        circle.style.transition = "stroke-dashoffset 1s ease";
        circle.style.strokeDashoffset = circleLength - (circleLength * value / 100);
    });

    const sphereImage = document.querySelector(".sphere-image");
    const baseWindowWidth = 1650;
    const MAX_WIDTH = 2560;
    let currentX = 0;
    let currentScale = 1;
    let isFirstFrame = true;
    

    if (sphereImage) {
        animateSphere();
    }

    /* --- MODALS --- */
    const addIncomeBtn = document.getElementById("addIncomeButton");
    const closeIncomeBtn = document.getElementById("closeIncomeButton");
    const addIncomeModal = document.getElementById("addIncomeModal");
    if (addIncomeBtn && closeIncomeBtn && addIncomeModal) {
        addIncomeBtn.addEventListener("click", () => addIncomeModal.style.display = "flex");
        closeIncomeBtn.addEventListener("click", () => addIncomeModal.style.display = "none");
    }

    const addExpenseBtn = document.getElementById("addExpenseButton");
    const closeExpenseBtn = document.getElementById("closeExpenseButton");
    const addExpenseModal = document.getElementById("addExpenseModal");
    if (addExpenseBtn && closeExpenseBtn && addExpenseModal) {
        addExpenseBtn.addEventListener("click", () => addExpenseModal.style.display = "flex");
        closeExpenseBtn.addEventListener("click", () => addExpenseModal.style.display = "none");
    }
});