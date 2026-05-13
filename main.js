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
    
    function createSparkline(canvasId, dataValues) {
        const canvas = document.getElementById(canvasId);

        return new Chart(canvas, {
            type: 'bar',

            data: {
                labels: dataValues.map((_, index) => index),
                datasets: [
                    {
                        data: dataValues,
                        barThickness: "3",
                        backgroundColor: (context) => {return context.dataIndex % 2 == 0 ? "#d4d4d4" : "#050505";},
                        barPercentage: 0.9, 
                        borderRadius: 2,
                        borderSkipped: false,
                    } 
                ]
            },

            options: {
                responsive: true,
                scales: {
                x: { display: false },
                y: { display: false }    
                },
                plugins: {
                    legend: {display: false}
                },
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        bottom: 1
                    }
                },
            },

        })
        };



    function createLineChart(canvasId, dataValues) {
        const canvas = document.getElementById(canvasId);

        const data = {
        labels: dataValues,
        datasets: [{
            label: 'My First Dataset',
            data: dataValues,
            fill: false,
            tension: 0.1
        }]
        };

        const config = {
            type: 'line',
            data: data,
            options: {
                maintainAspectRatio: false,
                aspectRatio: 3,
                pointBackgroundColor: 'white',
                borderColor: 'white',
                borderWidth: 1,
                pointRadius: 2,
                scales: {
                x: {display: false},
                y: {display: false},
                },
                plugins: {
                tooltip: {enabled: false},
                legend: {display: false}
                },
            },
        };

        return new Chart(canvas, config);

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
                            barThickness: "15",
                            backgroundColor: (context) => {return context.dataIndex % 2 == 0 ? "#d4d4d4" : "#050505";},
                            barPercentage: 1,
                            borderRadius: 3,
                            borderSkipped: false,
                        }
                    ]
                },

                options: {
                    responsive: true,
                    scales: {
                    x: { display: false },
                    y: { display: false }
                    },
                    plugins: {
                        legend: {display: false}
                    },
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            bottom: 1
                        }
                    },
                },

            })
    };

    const sparklineMedia = window.matchMedia("(min-width: 1920px)");

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

    const budgetDataValues = [65, 59, 80, 100, 70, 20, 12,]
    const sidebarDataValues = [65, 59, 80, 100, 70, 20, 0, 55, 42, 36];
    const incomeChart = createSparkline("incomeChart", getSparklineValues(incomeDataValues));
    const expenseChart = createSparkline("expenseChart", getSparklineValues(expenseDataValues));
    createLineChart("lineChart", sidebarDataValues)

    sparklineMedia.addEventListener("change", () => {
        updateSparkline(incomeChart, incomeDataValues);
        updateSparkline(expenseChart, expenseDataValues);
    });

    const valueItem = document.getElementById("circleProgressAmount");
    const rawValue = valueItem.textContent;
    const value = parseFloat(rawValue.replace("%", ""))
    
    
    const circle = document.querySelector(".circle-figure");
    const styles = getComputedStyle(circle);
    const circleLength = circle.getTotalLength();;
    circle.style.setProperty("stroke-dasharray", circleLength)
    circle.style.setProperty("stroke-dashoffset", circleLength);

    requestAnimationFrame(() => {
        circle.style.transition = "stroke-dashoffset 1s ease";
        circle.style.strokeDashoffset = circleLength - (circleLength * value / 100);
    });



    
    const balanceCard = document.querySelector(".balance-card");
    const sphereImage = document.querySelector(".sphere-image");

    if (balanceCard && sphereImage) {
    const baseWindowWidth = 1650;
    let currentX = 0;
    let currentScale = 1;
    let isFirstFrame = true;
    let frameCount = 0; // Добавляем счетчик кадров
    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    function animateSphere() {
        try {
            frameCount++;
            
            const extraWidth = Math.max(window.innerWidth - baseWindowWidth, 0);
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

            // Применяем стили
            sphereImage.style.transform = `translate3d(${currentX.toFixed(2)}px, 0, 0) scale(${currentScale.toFixed(3)})`;
            
            console.log(`[Кадр ${frameCount}] Отработал успешно`);
            
            requestAnimationFrame(animateSphere);
            
        } catch (error) {
            // ЕСЛИ ЦИКЛ УПАДЕТ, МЫ УВИДИМ ЭТО ЗДЕСЬ:
            console.error("🚨 ЦИКЛ УБИТ ОШИБКОЙ:", error.message);
            console.error(error.stack);
        }
    }

        animateSphere();
    }


});
