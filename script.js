document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('slider-track');
    const navButtons = document.querySelectorAll('.nav-btn');
    const logoBtn = document.querySelector('.logo-btn');
    const dots = document.querySelectorAll('.dot');
    const navLinkBtns = document.querySelectorAll('.nav-link-btn');
    const popupOverlay = document.getElementById('popup-overlay');
    const popupClose = document.getElementById('popup-close');
    const popupContent = document.getElementById('popup-content');

    const PANEL_COUNT = 5;
    const CENTER_PANEL = 2; // Main page is panel index 2
    let currentSlide = CENTER_PANEL;

    // ═══════════════════════════════════════════
    // SLIDER NAVIGATION
    // ═══════════════════════════════════════════

    function goToSlide(index) {
        if (index < 0 || index >= PANEL_COUNT) return;
        currentSlide = index;
        const offset = -(index * 100);
        track.style.transform = `translateX(${offset}vw)`;

        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');

        // Update nav buttons
        navButtons.forEach(btn => {
            const target = parseInt(btn.getAttribute('data-target'));
            btn.classList.toggle('active', target === index);
        });

        // Scroll panel content to top when navigating
        const panels = document.querySelectorAll('.panel-scroll');
        if (panels[index]) {
            panels[index].scrollTop = 0;
        }
    }

    // Nav button clicks
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = parseInt(e.currentTarget.getAttribute('data-target'));
            goToSlide(target);
        });
    });

    // Logo click (go home to center)
    logoBtn.addEventListener('click', () => {
        goToSlide(CENTER_PANEL);
    });

    // Mobile dots clicks
    dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            const target = parseInt(e.currentTarget.getAttribute('data-target'));
            goToSlide(target);
        });
    });

    // In-page navigation buttons (like "Узнать больше о Микробиоме")
    navLinkBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = parseInt(e.currentTarget.getAttribute('data-target'));
            goToSlide(target);
        });
    });

    // ═══════════════════════════════════════════
    // TOUCH / SWIPE SUPPORT
    // ═══════════════════════════════════════════

    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwiping = true;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        const touchEndX = e.changedTouches[0].screenX;
        const touchEndY = e.changedTouches[0].screenY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Only handle horizontal swipes (ignore vertical scrolling)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 60) {
            if (deltaX < 0 && currentSlide < PANEL_COUNT - 1) {
                goToSlide(currentSlide + 1);
            } else if (deltaX > 0 && currentSlide > 0) {
                goToSlide(currentSlide - 1);
            }
        }
        isSwiping = false;
    }, { passive: true });

    // ═══════════════════════════════════════════
    // KEYBOARD NAVIGATION
    // ═══════════════════════════════════════════

    document.addEventListener('keydown', (e) => {
        // Don't navigate if popup is open or user is typing
        if (popupOverlay.classList.contains('active')) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.key === 'ArrowLeft' && currentSlide > 0) {
            goToSlide(currentSlide - 1);
        } else if (e.key === 'ArrowRight' && currentSlide < PANEL_COUNT - 1) {
            goToSlide(currentSlide + 1);
        }
    });

    // ═══════════════════════════════════════════
    // PRODUCT POPUP MODAL
    // ═══════════════════════════════════════════

    const productData = {
        herbs: {
            title: 'Горькие травы (Антипаразитарный сбор)',
            description: `
                <p>Базовый антипаразитарный этап нашего протокола. Сбор включает тщательно подобранные горькие травы, которые веками использовались в натуропатии для мягкой нейтрализации патогенов.</p>
                <h3>Состав и действие</h3>
                <p>Полынь, пижма, гвоздика и черный орех — каждый компонент усиливает действие другого. Горечи стимулируют выработку желчи, что само по себе является антипаразитарным фактором.</p>
                <h3>Как принимать</h3>
                <p>Заваривать как чай, принимать натощак или за 30 минут до еды. Начинать с малых доз, постепенно увеличивая. Подробные дозировки — в PDF-протоколе.</p>
            `
        },
        pvjm: {
            title: 'Настойка ПВЖМ (Экстракт восковой моли)',
            description: `
                <p>Утренняя поддержка вашего организма. Экстракт личинок восковой моли содержит уникальный фермент — церразу.</p>
                <h3>Уникальные свойства</h3>
                <p>Церраза способна растворять защитные оболочки (биопленки) паразитов и вирусов, делая их уязвимыми для иммунной системы и антипаразитарных трав.</p>
                <h3>Как принимать</h3>
                <p>Несколько капель утром натощак, развести в небольшом количестве воды. Точная дозировка зависит от концентрации и указана в PDF-протоколе.</p>
            `
        },
        enzymes: {
            title: 'Живые ферменты (Яблочный уксус)',
            description: `
                <p>Подготовка пищеварительного тракта к оптимальной работе. Натуральный нефильтрованный яблочный уксус с «матерью» — живой культурой бактерий.</p>
                <h3>Зачем это нужно</h3>
                <p>Нормализует кислотность желудка, что критически важно для качественного усвоения микроэлементов и витаминов. Без нормальной кислотности пища не переваривается полностью.</p>
                <h3>Как принимать</h3>
                <p>Разводить в стакане воды, пить за 15-20 минут до еды. Это подготавливает желудок к приему пищи.</p>
            `
        },
        tea: {
            title: 'Травяной чай «45 трав»',
            description: `
                <p>Глубокое питание и детоксикация на клеточном уровне. Уникальная формула из 45 тщательно подобранных трав.</p>
                <h3>Действие</h3>
                <p>Очищает лимфатическую систему, питает клетки микроэлементами, поддерживает работу печени и почек. Идеально подходит как основа для процедуры тюбажа.</p>
                <h3>Как пить</h3>
                <p>Заваривать в термосе и пить в течение дня вместо обычного чая. Можно добавлять мед или лимон. Подробности заваривания — в видео-инструкции.</p>
            `
        },
        sorbents: {
            title: 'Умные сорбенты (Утренний и Вечерний)',
            description: `
                <p>Безопасная эвакуация токсинов из организма. Два вида порошка для утреннего и вечернего приема.</p>
                <h3>Механизм действия</h3>
                <p>Работают как природная губка — связывают и выводят продукты распада патогенов, тяжелые металлы и токсины. При этом не повреждают слизистую и не выводят полезные минералы.</p>
                <h3>Почему два вида</h3>
                <p>Утренний сорбент оптимизирован для работы с желудочной средой. Вечерний — для кишечника. Вместе они обеспечивают полный цикл очистки. Важно правильно разводить — смотрите видео!</p>
            `
        }
    };

    // Make openPopup globally available
    window.openPopup = function(productKey) {
        const product = productData[productKey];
        if (!product) return;

        popupContent.innerHTML = `
            <h2>${product.title}</h2>
            ${product.description}
        `;
        popupOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close popup
    function closePopup() {
        popupOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    popupClose.addEventListener('click', closePopup);
    popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) closePopup();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
    });

    // ═══════════════════════════════════════════
    // INITIAL STATE
    // ═══════════════════════════════════════════

    // Set initial active state for center panel nav
    goToSlide(CENTER_PANEL);
});
