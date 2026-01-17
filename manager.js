// manager.js - 뉴키즈 홈페이지 통합 관리자 (최종 수정버전)

// [전역 변수] 카테고리 데이터 저장소
window.GLOBAL_CATEGORIES = [];

// [안전장치] DB 연결 지연 시 즉시 보여줄 기본 메뉴 목록
// (이 목록 덕분에 '로딩 중...' 문구 없이 메뉴가 바로 뜹니다)
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
    { code: 'performance', name: '👨‍👩‍👧‍👦 부모 참여 행사', type: 'EVENT' }
];

(function initSystem() {
    // 1. Supabase 초기화
    if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
        window.sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY, {
            auth: {
                persistSession: true,
                storage: window.sessionStorage
            }
        });

        // 2. 설정과 카테고리 데이터 로드
        loadSiteConfig();
        loadCategories();
    } else {
        // Supabase가 없어도 기본 메뉴는 보여줌
        window.GLOBAL_CATEGORIES = DEFAULT_CATEGORIES;
        loadHeader();
    }
})();

// [기능 1] 사이트 환경 설정 불러오기
async function loadSiteConfig() {
    if (!window.sb) return;
    try {
        const { data } = await window.sb.from('site_config').select('*').eq('id', 1).single();
        if (data) {
            // 회사 정보 업데이트
            if (data.company_name) CONFIG.COMPANY.NAME = data.company_name;
            if (data.ceo_name) CONFIG.COMPANY.CEO = data.ceo_name;
            if (data.address) CONFIG.COMPANY.ADDRESS = data.address;
            if (data.phone) CONFIG.COMPANY.PHONE = data.phone;

            // 테마 색상 적용
            const root = document.documentElement;
            if (data.primary_color) root.style.setProperty('--primary-color', data.primary_color);
            if (data.accent_color) root.style.setProperty('--accent-color', data.accent_color);

            // 메인 페이지(index.html) 배경 및 텍스트 적용
            const mainHero = document.querySelector('.hero');
            if (mainHero) {
                // 배경 이미지
                if (data.main_hero_image) {
                    mainHero.style.backgroundImage = `linear-gradient(rgba(26,60,110,0.4), rgba(26,60,110,0.4)), url('${data.main_hero_image}')`;
                }
                // 텍스트 (제목/설명)
                const titleEl = mainHero.querySelector('h1');
                const descEl = mainHero.querySelector('p');
                if (titleEl && data.main_hero_title) titleEl.innerHTML = data.main_hero_title;
                if (descEl && data.main_hero_desc) descEl.innerHTML = data.main_hero_desc;
            }

            loadFooter(); // 정보 갱신 후 푸터 다시 그리기
        }
    } catch (e) {
        console.error("설정 로드 실패:", e);
    }
}

// [기능 2] 카테고리 데이터 불러오기 (안전장치 적용)
async function loadCategories() {
    if (!window.sb) {
        window.GLOBAL_CATEGORIES = DEFAULT_CATEGORIES;
        loadHeader();
        return;
    }

    try {
        const { data } = await window.sb
            .from('program_categories')
            .select('*')
            .eq('is_visible', true)
            .order('order_num', { ascending: true });

        if (data && data.length > 0) {
            window.GLOBAL_CATEGORIES = data;
        } else {
            // DB 데이터가 없으면 기본값 사용
            window.GLOBAL_CATEGORIES = DEFAULT_CATEGORIES;
        }
    } catch (e) {
        console.error("카테고리 로드 실패:", e);
        window.GLOBAL_CATEGORIES = DEFAULT_CATEGORIES;
    }

    // 메뉴 그리기 및 서브페이지 배경 적용
    loadHeader();
    applySubPageHero();
}

// [기능 3] 서브 페이지(child, program 등) 배경 및 텍스트 적용
function applySubPageHero() {
    const hero = document.getElementById('view-hero') || document.querySelector('.sub-hero');
    if (!hero) return;

    let currentCode = '';

    // 현재 페이지 파악
    if (location.pathname.includes('child.html')) {
        currentCode = location.hash.replace('#', '') || 'korean';
    } else if (location.pathname.includes('program.html')) {
        currentCode = location.hash.replace('#', '');
    } else if (location.pathname.includes('view.html')) {
        return; // 상세페이지는 별도 로직 따름
    } else {
        // season.html, culture.html 등 고정 페이지
        const pageName = location.pathname.split('/').pop();
        currentCode = pageName.replace('.html', '');
    }

    // 데이터 매칭
    const category = window.GLOBAL_CATEGORIES.find(c => c.code === currentCode);

    if (category) {
        // 배경 이미지
        if (category.hero_image) {
            hero.style.backgroundImage = `linear-gradient(rgba(26,60,110,0.8), rgba(26,60,110,0.8)), url('${category.hero_image}')`;
            hero.style.backgroundSize = 'cover';
            hero.style.backgroundPosition = 'center';
        }
        // 텍스트 (제목/설명)
        const titleEl = hero.querySelector('h1');
        const descEl = hero.querySelector('p');
        if (titleEl && category.hero_title) titleEl.innerHTML = category.hero_title;
        if (descEl && category.hero_desc) descEl.innerHTML = category.hero_desc;
    }
}

// [공용 함수] 상세 페이지(view.html) 배경 업데이트
window.updateHeroBackground = function (categoryCode) {
    const hero = document.getElementById('view-hero');
    if (!hero) return;

    const category = window.GLOBAL_CATEGORIES.find(c => c.code === categoryCode);
    if (category && category.hero_image) {
        hero.style.backgroundImage = `linear-gradient(rgba(26,60,110,0.8), rgba(26,60,110,0.8)), url('${category.hero_image}')`;
        hero.className = 'sub-hero';
        hero.style.backgroundSize = 'cover';
        hero.style.backgroundPosition = 'center';
    } else {
        hero.className = 'sub-hero bg-gray';
        hero.style.backgroundImage = 'none';
    }
};

// [공통 UI] 헤더(메뉴) 생성
function loadHeader() {
    const headerEl = document.querySelector('header');
    if (!headerEl) return;

    // 데이터가 없으면 기본값 사용 (로딩 대기화면 방지)
    const categories = (window.GLOBAL_CATEGORIES && window.GLOBAL_CATEGORIES.length > 0)
        ? window.GLOBAL_CATEGORIES
        : DEFAULT_CATEGORIES;

    // 기존 고정 파일 목록 (이 파일들은 .html로 연결, 나머지는 program.html로 연결)
    const legacyFiles = ['season', 'culture', 'performance'];

    const eduMenuHtml = categories
        .filter(c => c.type === 'EDU')
        .map(c => `<li><a href="child.html#${c.code}">${c.name}</a></li>`)
        .join('');

    const eventMenuHtml = categories
        .filter(c => c.type === 'EVENT')
        .map(c => {
            const href = legacyFiles.includes(c.code) ? `${c.code}.html` : `program.html#${c.code}`;
            return `<li><a href="${href}">${c.name}</a></li>`;
        })
        .join('');

    headerEl.innerHTML = `
        <div class="header-inner">
            <a href="index.html" class="logo-link">
                <img src="${CONFIG.LOGO_URL}" alt="NEW KIDS" class="logo-img">
            </a>
            
            <button class="mobile-btn" onclick="window.toggleMenu()">☰</button>
            
            <ul class="nav-menu" id="navMenu">
                <li class="has-sub">
                    <a href="javascript:void(0)" onclick="toggleSubMenu(this)">📚 교재소개 <span class="arrow">▼</span></a>
                    <ul class="dropdown double-col">
                        ${eduMenuHtml}
                    </ul>
                </li>

                <li class="has-sub">
                    <a href="javascript:void(0)" onclick="toggleSubMenu(this)">🎉 행사프로그램 <span class="arrow">▼</span></a>
                    <ul class="dropdown">
                        ${eventMenuHtml}
                    </ul>
                </li>
                
                <li><a href="order.html" style="font-weight:bold;">교재 발주</a></li>
                <li><a href="proposal.html" class="cta-menu">견적요청</a></li>
                <li><a href="https://www.kookminbooks.co.kr/" target ="_blank">국민서관</a></li>
            </ul>
        </div>
    `;
}

// [공통 UI] 푸터 생성
function loadFooter() {
    const footerEl = document.querySelector('footer');
    if (footerEl) {
        footerEl.innerHTML = `
            <div class="container">
                <p>${CONFIG.COMPANY.NAME} | 대표: <span>${CONFIG.COMPANY.CEO}</span></p>
                <p>주소: <span>${CONFIG.COMPANY.ADDRESS}</span></p>
                <p>문의: <span>${CONFIG.COMPANY.PHONE}</span></p>
                <br>
                <p>
                    <a href="admin.html" style="color:inherit; text-decoration:none;">
                        &copy; 2026 New Kids. All rights reserved.
                    </a>
                </p>
            </div>
        `;
    }
}

// [유틸리티] UI 동작 관련 함수들
window.toggleMenu = function () { document.getElementById('navMenu').classList.toggle('active'); };
window.toggleSubMenu = function (element) {
    if (window.innerWidth <= 768) {
        const parentLi = element.parentElement;
        const wasOpen = parentLi.classList.contains('sub-open');
        document.querySelectorAll('.nav-menu li.has-sub').forEach(li => li.classList.remove('sub-open'));
        if (!wasOpen) parentLi.classList.add('sub-open');
    }
};

function addScrollButtons() {
    if (document.querySelector('.scroll-btns')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="scroll-btns">
            <button class="btn-scroll" onclick="scrollToTop()">▲</button>
            <button class="btn-scroll" onclick="scrollToBottom()">▼</button>
        </div>
    `);
}
window.scrollToTop = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); }
window.scrollToBottom = function () { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }

window.getYoutubeId = function (url) {
    if (!url) return null;
    const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
    return (match && match[7].length === 11) ? match[7] : null;
};

window.formatDate = function (dateStr) { return dateStr ? dateStr.split('T')[0] : ''; };

function enableAutoResizeTextarea() {
    document.querySelectorAll('textarea.form-input').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
}

// DOM 로드 후 초기화
document.addEventListener("DOMContentLoaded", function () {
    // 로딩 대기 없이 헤더/푸터 바로 그리기
    loadHeader();
    loadFooter();
    addScrollButtons();
    enableAutoResizeTextarea();

    // 모바일 메뉴 닫기 처리
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('navMenu');
        const btn = document.querySelector('.mobile-btn');
        if (menu && menu.classList.contains('active')) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.remove('active');
            }
        }
    });

    // 해시 변경 시 배경 업데이트 (SPA 처럼 작동)
    window.addEventListener('hashchange', function () {
        if (location.pathname.includes('child.html') || location.pathname.includes('program.html')) {
            applySubPageHero();
        }
    });
});