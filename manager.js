// manager.js - 뉴키즈 홈페이지 통합 관리자 (v3.6 - 메뉴명 색상 적용)

window.GLOBAL_CATEGORIES = [];

// [안전장치] DB 연결 실패 시에만 사용할 기본 메뉴 데이터
const DEFAULT_CATEGORIES = [
    { code: 'korean', name: '🇰🇷 한글', type: 'EDU' },
    { code: 'reading', name: '📖 독서', type: 'EDU' },
    { code: 'english', name: '🔤 영어', type: 'EDU' },
    { code: 'math', name: '🔢 수학', type: 'EDU' },
    { code: 'science', name: '🔬 과학', type: 'EDU' },
    { code: 'art', name: '🎨 미술', type: 'EDU' },
    { code: 'coding', name: '💻 코딩', type: 'EDU' },
    { code: 'environment', name: '🌱 환경', type: 'EDU' },
    { code: 'nuri', name: '👶 누리과정', type: 'EDU' },
    { code: 'infant', name: '🧸 영아', type: 'EDU' },
    { code: 'special', name: '⭐ 기타(특색)', type: 'EDU' },
    { code: 'season', name: '🎉 시즌 테마 행사', type: 'EVENT' },
    { code: 'culture', name: '🌍 원어민 행사', type: 'EVENT' },
    { code: 'performance', name: '👨‍👩‍👧‍👦 부모 참여 행사', type: 'EVENT' },
    // 고정 페이지 (DB 로드 실패 시 대비용)
    { code: 'proposal', name: '견적 요청', type: 'PAGE' },
    { code: 'order', name: '교재 발주', type: 'PAGE' }
];

// [유틸리티] Hex 색상(#RRGGBB)을 RGBA로 변환 (오버레이용)
function hexToRgba(hex, opacity) {
    if (!hex) return `rgba(26, 60, 110, ${opacity})`; // 기본값: 남색
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// [초기화] 시스템 시작
(function initSystem() {
    if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
        startSupabase();
    } else {
        let attempts = 0;
        const waitForSupabase = setInterval(() => {
            if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
                clearInterval(waitForSupabase);
                startSupabase();
            } else {
                attempts++;
                if (attempts > 50) {
                    clearInterval(waitForSupabase);
                    console.error("Supabase 로드 실패");
                    // 로딩 실패 시에도 화면은 표시되도록 처리
                    document.querySelectorAll('.hero, .sub-hero').forEach(el => el.classList.add('loaded'));
                }
            }
        }, 50);
    }
})();

function startSupabase() {
    window.sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
        auth: { persistSession: true, storage: window.sessionStorage }
    });
    loadSiteConfig();
    loadCategories();
}

// [1] 사이트 전역 설정 로드 (메인 히어로, 회사정보 등)
async function loadSiteConfig() {
    if (!window.sb) return;
    const mainHero = document.querySelector('.hero');

    try {
        const { data } = await window.sb.from('site_config').select('*').eq('id', 1).single();
        if (data) {
            // 회사 정보 설정
            if (data.company_name) CONFIG.COMPANY.NAME = data.company_name;
            if (data.ceo_name) CONFIG.COMPANY.CEO = data.ceo_name;
            if (data.address) CONFIG.COMPANY.ADDRESS = data.address;
            if (data.phone) CONFIG.COMPANY.PHONE = data.phone;

            // 테마 컬러 적용
            const root = document.documentElement;
            if (data.primary_color) root.style.setProperty('--primary-color', data.primary_color);
            if (data.accent_color) root.style.setProperty('--accent-color', data.accent_color);

            // 메인 히어로 섹션 설정
            if (mainHero) {
                if (data.main_hero_image) {
                    // 오버레이 적용
                    const overlayColor = data.main_hero_overlay_color || '#1a3c6e';
                    const overlayOpacity = data.main_hero_overlay_opacity !== undefined ? data.main_hero_overlay_opacity : 0.4;
                    const rgba = hexToRgba(overlayColor, overlayOpacity);

                    mainHero.style.backgroundImage = `linear-gradient(${rgba}, ${rgba}), url('${data.main_hero_image}')`;
                    mainHero.style.backgroundColor = 'transparent';
                } else {
                    mainHero.style.backgroundImage = 'none';
                    mainHero.style.backgroundColor = data.main_hero_bg_color || '#1a3c6e';
                }

                // 텍스트 색상 적용
                if (data.main_hero_title_color) {
                    const h1 = mainHero.querySelector('h1');
                    if (h1) h1.style.color = data.main_hero_title_color;
                }
                if (data.main_hero_desc_color) {
                    const p = mainHero.querySelector('p');
                    if (p) p.style.color = data.main_hero_desc_color;
                }

                // 내용 적용
                const titleEl = mainHero.querySelector('h1');
                const descEl = mainHero.querySelector('p');
                if (titleEl && data.main_hero_title) titleEl.innerHTML = data.main_hero_title;
                if (descEl && data.main_hero_desc) descEl.innerHTML = data.main_hero_desc;
            }
            loadFooter();
        }
    } catch (e) { console.error("설정 로드 실패:", e); }

    if (mainHero) mainHero.classList.add('loaded');
}

// [2] 카테고리 정보 로드 및 메뉴 생성
async function loadCategories() {
    if (!window.sb) return;

    try {
        const { data } = await window.sb.from('program_categories')
            .select('*')
            .eq('is_visible', true)
            .order('order_num', { ascending: true });

        if (data && data.length > 0) {
            window.GLOBAL_CATEGORIES = data;
        } else {
            window.GLOBAL_CATEGORIES = DEFAULT_CATEGORIES;
        }
    } catch (e) {
        window.GLOBAL_CATEGORIES = DEFAULT_CATEGORIES;
    }

    loadHeader();
    applySubPageHero();
}

// [3] 서브 페이지(카테고리) 히어로 섹션 적용
function applySubPageHero() {
    const hero = document.getElementById('view-hero') || document.querySelector('.sub-hero');
    if (!hero) return;

    let currentCode = '';

    // 현재 페이지/카테고리 식별 로직
    if (location.pathname.includes('child.html')) {
        currentCode = location.hash.replace('#', '') || 'korean';
    } else if (location.pathname.includes('program.html')) {
        currentCode = location.hash.replace('#', '');
    } else if (location.pathname.includes('proposal.html')) {
        currentCode = 'proposal';
    } else if (location.pathname.includes('order.html')) {
        currentCode = 'order';
    } else if (location.pathname.includes('view.html')) {
        // view.html은 별도 함수(updateHeroBackground)에서 처리되지만 초기값 설정을 위해 둠
    } else {
        // 기타 정적 페이지 (예: season.html 등 레거시)
        currentCode = location.pathname.split('/').pop().replace('.html', '');
    }

    const category = window.GLOBAL_CATEGORIES.find(c => c.code === currentCode);
    if (category) {
        // 배경 이미지 및 오버레이 적용
        if (category.hero_image) {
            const overlayColor = category.hero_overlay_color || '#1a3c6e';
            const overlayOpacity = category.hero_overlay_opacity !== undefined ? category.hero_overlay_opacity : 0.8;
            const rgba = hexToRgba(overlayColor, overlayOpacity);

            hero.style.backgroundImage = `linear-gradient(${rgba}, ${rgba}), url('${category.hero_image}')`;
            hero.style.backgroundSize = 'cover';
            hero.style.backgroundPosition = 'center';
            hero.style.backgroundColor = 'transparent';
        } else {
            // 이미지가 없으면 DB에 저장된 배경색 사용 (fallback)
            hero.style.backgroundImage = 'none';
            hero.style.backgroundColor = category.hero_bg_color || '#1a3c6e';
        }

        // 텍스트 색상 적용
        if (category.hero_title_color) {
            const h1 = hero.querySelector('h1');
            if (h1) h1.style.color = category.hero_title_color;
        }
        if (category.hero_desc_color) {
            const p = hero.querySelector('p');
            if (p) p.style.color = category.hero_desc_color;
        }

        // 내용 적용
        const titleEl = hero.querySelector('h1');
        const descEl = hero.querySelector('p');
        if (titleEl && category.hero_title) titleEl.innerHTML = category.hero_title;
        if (descEl && category.hero_desc) descEl.innerHTML = category.hero_desc;
    }

    hero.classList.add('loaded');
}

// [4] 상세 페이지(view.html) 히어로 업데이트 함수
window.updateHeroBackground = function (categoryCode) {
    const hero = document.getElementById('view-hero');
    if (!hero) return;
    const category = window.GLOBAL_CATEGORIES.find(c => c.code === categoryCode);

    if (category) {
        if (category.hero_image) {
            const overlayColor = category.hero_overlay_color || '#1a3c6e';
            const overlayOpacity = category.hero_overlay_opacity !== undefined ? category.hero_overlay_opacity : 0.8;
            const rgba = hexToRgba(overlayColor, overlayOpacity);

            hero.style.backgroundImage = `linear-gradient(${rgba}, ${rgba}), url('${category.hero_image}')`;
            hero.className = 'sub-hero'; // 기존 클래스 초기화
            hero.style.backgroundSize = 'cover';
            hero.style.backgroundPosition = 'center';
            hero.style.backgroundColor = 'transparent';
        } else {
            hero.style.backgroundImage = 'none';
            hero.style.backgroundColor = category.hero_bg_color || '#1a3c6e';
        }

        if (category.hero_title_color) {
            const h1 = hero.querySelector('h1');
            if (h1) h1.style.color = category.hero_title_color;
        }
        if (category.hero_desc_color) {
            const p = hero.querySelector('p');
            if (p) p.style.color = category.hero_desc_color;
        }
    } else {
        hero.className = 'sub-hero bg-gray';
        hero.style.backgroundImage = 'none';
    }

    hero.classList.add('loaded');
};

// [5] 헤더(네비게이션) 생성
function loadHeader() {
    const headerEl = document.querySelector('header');
    if (!headerEl) return;

    const categories = (window.GLOBAL_CATEGORIES && window.GLOBAL_CATEGORIES.length > 0)
        ? window.GLOBAL_CATEGORIES
        : DEFAULT_CATEGORIES;

    const legacyFiles = ['season', 'culture', 'performance'];

    // [수정] 메뉴명 색상(menu_text_color) 적용 로직 추가
    const eduMenuHtml = categories.filter(c => c.type === 'EDU')
        .map(c => {
            const colorStyle = c.menu_text_color ? `style="color:${c.menu_text_color}"` : '';
            return `<li><a href="child.html#${c.code}" ${colorStyle}>${c.name}</a></li>`;
        }).join('');

    const eventMenuHtml = categories.filter(c => c.type === 'EVENT')
        .map(c => {
            const href = legacyFiles.includes(c.code) ? `${c.code}.html` : `program.html#${c.code}`;
            const colorStyle = c.menu_text_color ? `style="color:${c.menu_text_color}"` : '';
            return `<li><a href="${href}" ${colorStyle}>${c.name}</a></li>`;
        }).join('');

    headerEl.innerHTML = `
        <div class="header-inner">
            <a href="index.html" class="logo-link"><img src="${CONFIG.LOGO_URL}" alt="NEW KIDS" class="logo-img"></a>
            <button class="mobile-btn" onclick="window.toggleMenu()">☰</button>
            <ul class="nav-menu" id="navMenu">
                <li class="has-sub">
                    <a href="javascript:void(0)" onclick="toggleSubMenu(this)">📚 교재소개 <span class="arrow">▼</span></a>
                    <ul class="dropdown double-col">${eduMenuHtml}</ul>
                </li>
                <li class="has-sub">
                    <a href="javascript:void(0)" onclick="toggleSubMenu(this)">🎉 행사프로그램 <span class="arrow">▼</span></a>
                    <ul class="dropdown">${eventMenuHtml}</ul>
                </li>
                <li><a href="order.html" style="font-weight:bold;">교재 발주</a></li>
                <li><a href="proposal.html" class="cta-menu">견적요청</a></li>
                <li><a href="https://www.kookminbooks.co.kr/" target ="_blank">국민서관</a></li>
            </ul>
        </div>`;
}

// [6] 푸터 생성
function loadFooter() {
    const footerEl = document.querySelector('footer');
    if (footerEl) {
        footerEl.innerHTML = `<div class="container"><p>${CONFIG.COMPANY.NAME} | 대표: <span>${CONFIG.COMPANY.CEO}</span></p><p>주소: <span>${CONFIG.COMPANY.ADDRESS}</span></p><p>문의: <span>${CONFIG.COMPANY.PHONE}</span></p><br><p><a href="admin.html" style="color:inherit; text-decoration:none;">&copy; 2026 New Kids. All rights reserved.</a></p></div>`;
    }
}

// [7] 기타 공통 UI 기능
window.toggleMenu = function () {
    document.getElementById('navMenu').classList.toggle('active');
};

window.toggleSubMenu = function (el) {
    if (window.innerWidth <= 768) {
        const p = el.parentElement;
        const o = p.classList.contains('sub-open');
        document.querySelectorAll('.nav-menu li.has-sub').forEach(li => li.classList.remove('sub-open'));
        if (!o) p.classList.add('sub-open');
    }
};

function addScrollButtons() {
    if (document.querySelector('.scroll-btns')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="scroll-btns"><button class="btn-scroll" onclick="scrollToTop()">▲</button><button class="btn-scroll" onclick="scrollToBottom()">▼</button></div>`);
}

window.scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }) };
window.scrollToBottom = () => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) };

window.getYoutubeId = (u) => {
    if (!u) return null;
    const m = u.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
    return (m && m[7].length === 11) ? m[7] : null;
};

window.formatDate = (d) => { return d ? d.split('T')[0] : ''; };

function enableAutoResizeTextarea() {
    document.querySelectorAll('textarea.form-input').forEach(t => {
        t.style.height = 'auto';
        t.style.height = (t.scrollHeight) + 'px';
        t.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
}

// [8] 이벤트 리스너 등록
document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadFooter();
    addScrollButtons();
    enableAutoResizeTextarea();

    // 외부 클릭 시 모바일 메뉴 닫기
    document.addEventListener('click', e => {
        const m = document.getElementById('navMenu');
        const b = document.querySelector('.mobile-btn');
        if (m && m.classList.contains('active') && !m.contains(e.target) && !b.contains(e.target)) {
            m.classList.remove('active');
        }
    });

    // 해시 변경 시(서브페이지 이동 시) 배경 업데이트
    window.addEventListener('hashchange', () => {
        if (location.pathname.includes('child.html') || location.pathname.includes('program.html')) {
            applySubPageHero();
        }
    });
});

// 모바일 메뉴 제어 보강
document.addEventListener("DOMContentLoaded", function () {
    const mobileBtn = document.querySelector('.mobile-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
        });
    }
    const menuLinks = document.querySelectorAll('.nav-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) navMenu.classList.remove('active');
        });
    });
});