// manager.js - 통합 로직 관리자

(function initSystem() {
    // 1. Supabase 초기화 (Config 사용)
    if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
        window.sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    }
})();

// [공통 기능] 헤더 로드
function loadHeader() {
    const headerEl = document.querySelector('header');
    if (headerEl) {
        headerEl.innerHTML = `
            <div class="header-inner">
                <a href="index.html" class="logo-link"><img src="${CONFIG.LOGO_URL}" alt="NEW KIDS" class="logo-img"></a>
                <button class="mobile-btn" onclick="window.toggleMenu()">☰</button>
                <ul class="nav-menu" id="navMenu">
                    <li><a href="index.html">홈으로</a></li>
                    <li>
                        <a href="javascript:void(0)" onclick="window.toggleSubMenu(this)">교재소개 ▾</a>
                        <ul class="dropdown">
                            <li><a href="child.html#korean">📚 한글 & 독서</a></li>
                            <li><a href="child.html#art">🎨 미술 & 자연 환경</a></li>
                            <li><a href="child.html#science">🔬 수학 & 과학</a></li>
                            <li><a href="child.html#coding">💻 코딩 & 직업교육</a></li>
                            <li><a href="child.html#english">🔤 영어 & 지도</a></li>
                            <li><a href="child.html#integrated">👶 통합보육 & 누리과정</a></li>
                        </ul>
                    </li>
                    <li>
                        <a href="javascript:void(0)" onclick="window.toggleSubMenu(this)">행사프로그램 ▾</a>
                        <ul class="dropdown">
                            <li><a href="season.html">🎉 시즌 테마 행사</a></li>
                            <li><a href="culture.html">🌍 원어민 행사</a></li>
                            <li><a href="performance.html">👨‍👩‍👧‍👦 부모 참여 행사</a></li>
                        </ul>
                    </li>
                    <li><a href="order.html" style="font-weight:bold;">교재 발주</a></li>
                    <li><a href="proposal.html" class="cta-menu">견적요청</a></li>
                </ul>
            </div>
        `;
    }
}

// [공통 기능] 푸터 로드
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
                    <a href="admin.html" style="color:inherit; text-decoration:none; cursor:pointer;" title="관리자 로그인">
                        &copy; 2026 New Kids. All rights reserved.
                    </a>
                </p>
            </div>
        `;
    }
}

// [공통 기능] 모바일 메뉴
window.toggleMenu = function () { document.getElementById('navMenu').classList.toggle('active'); };
window.toggleSubMenu = function (el) { if (window.innerWidth <= 768) el.parentElement.classList.toggle('sub-open'); };

// [유틸리티] 유튜브 ID 추출
window.getYoutubeId = function (url) {
    if (!url) return null;
    const match = url.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);
    return (match && match[7].length === 11) ? match[7] : null;
};

// [유틸리티] 날짜 포맷
window.formatDate = function (dateStr) {
    return dateStr ? dateStr.split('T')[0] : '';
};

// DOM 로드 후 실행
document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadFooter();

    // 모바일 메뉴 닫기 (외부 클릭 시)
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('navMenu');
        const btn = document.querySelector('.mobile-btn');
        if (menu && menu.classList.contains('active')) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) menu.classList.remove('active');
        }
    });
});