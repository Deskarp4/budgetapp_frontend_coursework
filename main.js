document.addEventListener('DOMContentLoaded', function() {
    

    const sidebarDataValues = [65, 59, 80, 100, 70, 20, 0, 55, 42, 36];

   function createLineChart(canvasId, dataValues) {
    const canvas = document.getElementById(canvasId);

    const chart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dataValues,
            datasets: [{
                data: dataValues.map(() => 0), // ← нули для старта
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            animation: false, // ← отключаем на время инициализации
            maintainAspectRatio: false,
            pointBackgroundColor: 'white',
            borderColor: 'white',
            borderWidth: 1,
            pointRadius: 2,
            scales: { x: { display: false }, y: { display: false } },
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            },
        },
    });

    setTimeout(() => {
        chart.data.datasets[0].data = dataValues;
        chart.options.animation = { duration: 1200, easing: 'easeOutQuart' };
        chart.update();
    }, 50);

    return chart;
}

    createLineChart("lineChart", sidebarDataValues);


    /* ---------------- MOBILE MENU TOGGLE ---------------- */
    const menuToggle = document.querySelector(".menu-toggle");
    const sidebar = document.querySelector(".sidebar");
    const backdrop = document.querySelector(".sidebar-backdrop");

    function setSidebar(open) {
        if (!sidebar || !menuToggle) return;
        sidebar.classList.toggle("is-open", open);
        menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
        document.body.classList.toggle("sidebar-open", open);
        if (backdrop) {
            backdrop.classList.toggle("is-visible", open);
        }
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.contains("is-open");
            setSidebar(!isOpen);
        });

        if (backdrop) {
            backdrop.addEventListener("click", () => setSidebar(false));
        }

        // Close on link click (within the drawer)
        sidebar.querySelectorAll(".sidebar-item").forEach(item => {
            item.addEventListener("click", () => {
                if (window.matchMedia("(max-width: 900px)").matches) {
                    setSidebar(false);
                }
            });
        });

        // Close on Esc
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") setSidebar(false);
        });

        // Reset state when crossing the breakpoint
        const drawerMq = window.matchMedia("(min-width: 901px)");
        drawerMq.addEventListener("change", (e) => {
            if (e.matches) setSidebar(false);
        });
    }
});
