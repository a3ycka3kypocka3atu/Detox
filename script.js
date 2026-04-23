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
    // THEME TOGGLE (Dark/Light Mode)
    // ═══════════════════════════════════════════
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');

    function setTheme(themeName) {
        if (themeName === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            document.documentElement.removeAttribute('data-theme');
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
        localStorage.setItem('santiago_theme', themeName);
    }

    // Initialize Theme
    const savedTheme = localStorage.getItem('santiago_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDark) {
        setTheme('dark');
    } else {
        setTheme('light');
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

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

        // Update side nav arrows visibility
        if (typeof updateSideNav === 'function') updateSideNav();
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
    // SIDE NAV ZONES (Proportional mouse-drag slide peeking)
    // ═══════════════════════════════════════════
    // The active zone starts right after the panel-content area.
    // Moving the mouse toward the screen edge gradually shifts the slide.
    // Reaching the very edge commits the slide change.
    // Pulling back before the edge snaps back to the original slide.

    const sideNavLeft = document.getElementById('side-nav-left');
    const sideNavRight = document.getElementById('side-nav-right');

    // State for proportional peeking
    let isPeeking = false;
    let peekDirection = null; // 'left' or 'right'
    let peekBaseSlide = null;
    let isTransitioning = false; // lock during committed transitions

    function updateSideNav() {
        if (!sideNavLeft || !sideNavRight) return;
        sideNavLeft.classList.toggle('hidden', currentSlide === 0);
        sideNavRight.classList.toggle('hidden', currentSlide === PANEL_COUNT - 1);
    }

    // Calculate where the CURRENT panel's content edges are (the text zone)
    function getContentEdges() {
        const panels = document.querySelectorAll('.panel');
        const currentPanel = panels[currentSlide];
        const panelContentEl = currentPanel
            ? currentPanel.querySelector('.panel-content')
            : null;

        if (!panelContentEl) {
            // fallback: assume 900px centered
            const contentWidth = Math.min(900, window.innerWidth);
            const leftEdge = (window.innerWidth - contentWidth) / 2;
            return { left: leftEdge, right: leftEdge + contentWidth };
        }

        // panel-content is inside the slider-track which is translated,
        // so getBoundingClientRect gives its on-screen position.
        // But during peek the track moves, so we compute from the panel-content's
        // own width & centering, which is constant regardless of track offset.
        const contentWidth = panelContentEl.offsetWidth;
        const leftEdge = (window.innerWidth - contentWidth) / 2;
        return { left: leftEdge, right: leftEdge + contentWidth };
    }

    // Global mousemove handler for proportional peeking (hint only, no auto-switch)
    function handleMouseMove(e) {
        if (isTransitioning) return;
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const navbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72;

        // Ignore if mouse is in the navbar area
        if (mouseY < navbarHeight) {
            if (isPeeking) cancelPeek();
            return;
        }

        const edges = getContentEdges();
        const screenW = window.innerWidth;

        // LEFT ZONE: mouse is to the left of text content
        if (mouseX < edges.left && currentSlide > 0) {
            if (!isPeeking || peekDirection !== 'left') {
                startPeek('left');
            }
            // Calculate progress: 0 at content edge, 1 at screen edge
            const zoneWidth = edges.left;
            const progress = Math.max(0, Math.min(1, (edges.left - mouseX) / zoneWidth));

            applyPeekOffset(progress, 'left');

            // Show the arrow + glow
            if (sideNavLeft) sideNavLeft.classList.add('peek-active');
            if (sideNavRight) sideNavRight.classList.remove('peek-active');
        }
        // RIGHT ZONE: mouse is to the right of text content
        else if (mouseX > edges.right && currentSlide < PANEL_COUNT - 1) {
            if (!isPeeking || peekDirection !== 'right') {
                startPeek('right');
            }
            // Calculate progress: 0 at content edge, 1 at screen edge
            const zoneWidth = screenW - edges.right;
            const progress = Math.max(0, Math.min(1, (mouseX - edges.right) / zoneWidth));

            applyPeekOffset(progress, 'right');

            // Show the arrow + glow
            if (sideNavRight) sideNavRight.classList.add('peek-active');
            if (sideNavLeft) sideNavLeft.classList.remove('peek-active');
        }
        // Mouse is back in the text content area
        else {
            if (isPeeking) {
                cancelPeek();
            }
        }
    }

    function startPeek(direction) {
        isPeeking = true;
        peekDirection = direction;
        peekBaseSlide = currentSlide;
        // Disable CSS transition — we animate with requestAnimationFrame instead
        track.style.transition = 'none';
        // Initialize lerp state from current position
        peekCurrentOffset = -(currentSlide * 100);
        peekTargetOffset = peekCurrentOffset;
        // Start the animation loop
        if (!peekAnimating) {
            peekAnimating = true;
            requestAnimationFrame(peekAnimationLoop);
        }
    }

    // Max peek: just a subtle hint, not a full panel shift
    const MAX_PEEK_VW = 4;
    // Lerp smoothing factor (0 = no movement, 1 = instant). Lower = smoother/slower.
    const LERP_FACTOR = 0.06;

    let peekTargetOffset = 0;   // Where we want to be (vw)
    let peekCurrentOffset = 0;  // Where we actually are (vw)
    let peekAnimating = false;

    function applyPeekOffset(progress, direction) {
        // Compute target offset
        const baseOffset = -(peekBaseSlide * 100); // in vw
        const peekAmount = progress * MAX_PEEK_VW; // in vw (no extra easing, lerp handles smoothing)

        if (direction === 'left') {
            peekTargetOffset = baseOffset + peekAmount;
        } else {
            peekTargetOffset = baseOffset - peekAmount;
        }
    }

    function peekAnimationLoop() {
        if (!peekAnimating) return;

        // Smoothly interpolate current toward target
        peekCurrentOffset += (peekTargetOffset - peekCurrentOffset) * LERP_FACTOR;

        // Apply the smoothed position
        track.style.transform = `translateX(${peekCurrentOffset}vw)`;

        // Keep animating if we haven't settled
        if (Math.abs(peekTargetOffset - peekCurrentOffset) > 0.01) {
            requestAnimationFrame(peekAnimationLoop);
        } else {
            // Close enough — snap to exact target
            peekCurrentOffset = peekTargetOffset;
            track.style.transform = `translateX(${peekCurrentOffset}vw)`;
            // If still peeking, keep the loop alive for future mouse moves
            if (isPeeking) {
                requestAnimationFrame(peekAnimationLoop);
            } else {
                peekAnimating = false;
            }
        }
    }

    function cancelPeek() {
        if (!isPeeking) return;
        isPeeking = false;

        // Stop the animation loop
        peekAnimating = false;

        // Smooth snap back with CSS transition
        track.style.transition = 'transform 1.2s cubic-bezier(0.22, 0.68, 0.35, 1)';
        const baseOffset = -(peekBaseSlide * 100);
        track.style.transform = `translateX(${baseOffset}vw)`;

        // Reset lerp state
        peekCurrentOffset = baseOffset;
        peekTargetOffset = baseOffset;

        if (sideNavLeft) sideNavLeft.classList.remove('peek-active');
        if (sideNavRight) sideNavRight.classList.remove('peek-active');
        peekDirection = null;
        peekBaseSlide = null;

        // Restore default transition after snap-back
        setTimeout(() => {
            track.style.transition = 'var(--transition-slide)';
        }, 1300);
    }

    // Attach global mousemove — only active on desktop (not mobile)
    if (window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', handleMouseMove);

        // Also cancel peek if mouse leaves the window entirely
        document.addEventListener('mouseleave', () => {
            if (isPeeking) cancelPeek();
        });
    }

    // Click ANYWHERE in the active zone (outside text) to instantly switch slides
    document.addEventListener('click', (e) => {
        if (isTransitioning) return;

        // Ignore clicks on interactive elements (buttons, links, inputs, etc.)
        const tag = e.target.tagName;
        if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if (e.target.closest('button, a, .popup-overlay, .navbar, .mobile-dots')) return;

        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const navbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72;

        // Ignore clicks in navbar
        if (mouseY < navbarHeight) return;

        const edges = getContentEdges();

        // Click in left zone
        if (mouseX < edges.left && currentSlide > 0) {
            if (isPeeking) cancelPeek();
            isTransitioning = true;
            track.style.transition = 'transform 1.6s cubic-bezier(0.22, 0.68, 0.35, 1)';
            goToSlide(currentSlide - 1);
            setTimeout(() => {
                isTransitioning = false;
                track.style.transition = 'var(--transition-slide)';
            }, 1700);
        }
        // Click in right zone
        else if (mouseX > edges.right && currentSlide < PANEL_COUNT - 1) {
            if (isPeeking) cancelPeek();
            isTransitioning = true;
            track.style.transition = 'transform 1.6s cubic-bezier(0.22, 0.68, 0.35, 1)';
            goToSlide(currentSlide + 1);
            setTimeout(() => {
                isTransitioning = false;
                track.style.transition = 'var(--transition-slide)';
            }, 1700);
        }
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
    // LANGUAGE SWITCHER (4-Language i18n)
    // ═══════════════════════════════════════════

    const langBtns = document.querySelectorAll('.lang-btn');
    let currentLang = localStorage.getItem('santiago-lang') || 'ru';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('santiago-lang', lang);

        // Update active class on buttons
        langBtns.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 1. Swap all text using translations dictionary
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key] && translations[key][lang]) {
                // If it's the hero title, keep it simple, or innerHTML if needed.
                // Using innerHTML allows for bold tags etc., but textContent is safer.
                el.innerHTML = translations[key][lang]; 
            }
        });

        // 2. Swap PDF download links based on data-pdf attributes
        document.querySelectorAll('[data-pdf-ru][data-pdf-ua][data-pdf-cz][data-pdf-en]').forEach(link => {
            link.href = link.getAttribute(`data-pdf-${lang}`);
        });

        // 3. Update HTML lang attribute
        const htmlLangs = {
            'ru': 'ru',
            'ua': 'uk',
            'cz': 'cs',
            'en': 'en'
        };
        document.documentElement.lang = htmlLangs[lang] || 'ru';
    }

    if (langBtns.length > 0) {
        langBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                setLanguage(btn.dataset.lang);
            });
        });
        
        // Apply saved language on load
        setLanguage(currentLang);
    }

    // ═══════════════════════════════════════════
    // INITIAL STATE
    // ═══════════════════════════════════════════

    // Set initial active state for center panel nav
    goToSlide(CENTER_PANEL);
});
