document.addEventListener('DOMContentLoaded', function() {
    

    const incomeDataValues = [20, 70, 15, 30, 12, 18, 40, 10, 5, 50,20, 70, 15, 30, 12, 18, 40, 10, 5, 50,];
    const expenseDataValues = [20, 50, 15, 30, 35, 18, 70, 10, 5, 50,20, 70, 15, 30, 12, 18, 40, 10, 5, 50,];
    
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

    createSparkline("incomeChart", incomeDataValues);
    createSparkline("expenseChart", expenseDataValues);


    function createCircleProgress(canvasId, dataValues) {
        const canvas = document.getElementById(canvasId);

        const backgroundTrackPLugin = {
            id: "backgroundTrack",
            beforeDraw: function(chart) {
                const ctx = chart.ctx;
                const meta = chart.getDatasetMeta(0);
                const bgGradient = ctx.createLinearGradient(0,0,0,180);
                bgGradient.addColorStop(0, 'hsl(0, 0%, 97%)'); 
                bgGradient.addColorStop(1, 'hsl(0, 0%, 85%)');
                if(!meta.data.length) return;

                const arc = meta.data[0];
                const x = arc.x;
                const y = arc.y;
                const thickness = arc.outerRadius - arc.innerRadius;
                const radius = arc.innerRadius + thickness / 2

                ctx.save();
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2*Math.PI);
                ctx.lineWidth = thickness;

                ctx.strokeStyle = bgGradient;
                ctx.stroke();
                ctx.restore();
            }
        }

        return new Chart(canvas, {
            type: 'doughnut',

            data: {
                datasets: [{
                    data: [100-value, value], 
                    backgroundColor: [
                        "transparent",
                        "rgb(0, 0, 0)"
                    ],
                    borderWidth: 0,
                    borderRadius: 20,
                }]
            },
            plugins: [
                backgroundTrackPLugin,
            ],
            options: {
                cutout: "78%",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: false
                    }
                }
            },
        })
    }

    const valueItem = document.getElementById("circleProgressAmount");
    const rawValue = valueItem.textContent;
    const value = parseFloat(rawValue.replace("%", ""))
    createCircleProgress("budgetProgress", value);
    
    
    const circle = document.querySelector(".circle-progress circle");
    const styles = getComputedStyle(circle);
    const circleLength = circle.getTotalLength();;
    circle.style.setProperty("stroke-dasharray", circleLength)
    circle.style.setProperty("stroke-dashoffset", circleLength);

    requestAnimationFrame(() => {
        circle.style.transition = "stroke-dashoffset 1s ease";
        circle.style.strokeDashoffset = circleLength - (circleLength * value / 100);
});

});