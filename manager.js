// manager.js - 공통 기능 관리 (헤더/푸터/유틸리티)

// [1] 시스템 초기화 (Supabase 및 뷰포트 설정)
function initSystem() {
    // 1. 뷰포트 메타태그 자동 설정
    if (!document.querySelector('meta[name="viewport"]')) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0';
        document.head.prepend(meta);
    }

    // 2. Supabase 클라이언트 초기화 (안전 장치 추가)
    if (window.sb) return; // 이미 초기화되었다면 중단

    if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
        window.sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log("Supabase 연결 성공");
    } else {
        // 라이브러리 로드 속도 차이로 아직 준비 안 됐다면 0.1초 뒤 재시도
        console.warn("Supabase 라이브러리 로드 대기 중...");
        setTimeout(initSystem, 100);
    }
}

// 스크립트 로드 시 실행
initSystem();
document.addEventListener("DOMContentLoaded", initSystem);

// [헤더 로드 함수]
function loadHeader() {
    const headerEl = document.querySelector('header');
    if (headerEl) {
        headerEl.innerHTML = `
            <div class="header-inner">
                <a href="index.html" class="logo-link">
                    <img src="${CONFIG.LOGO_URL}" alt="NEW KIDS" class="logo-img">
                </a>
                
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
                    <li><a href="order.html" style="font-weight:bold; color:var(--primary-color);">교재 발주</a></li>
                    <li><a href="proposal.html" class="cta-menu">견적요청</a></li>
                </ul>
            </div>
        `;
    }
}

// [푸터 로드 함수]
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
                    <a href="admin.html" style="color:inherit; text-decoration:none;" title="관리자 로그인">
                        &copy; 2026 New Kids. All rights reserved.
                    </a>
                </p>
            </div>
        `;
    }
}

// [기능] 모바일 메뉴 토글
window.toggleMenu = function () {
    const menu = document.getElementById('navMenu');
    if (menu) menu.classList.toggle('active');
};

// [기능] 모바일 서브메뉴(드롭다운) 토글
window.toggleSubMenu = function (el) {
    if (window.innerWidth <= 768) {
        el.parentElement.classList.toggle('sub-open');
    }
};

// [중요] 날짜 포맷 변환 함수 (YYYY.MM.DD)
window.formatDate = function (dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    } catch (e) {
        return dateString;
    }
};

// [중요] 유튜브 URL에서 ID 추출 함수
window.getYoutubeId = function (url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// 페이지 로드 완료 시 실행
document.addEventListener("DOMContentLoaded", function () {
    loadHeader();
    loadFooter();
    initSystem(); // 혹시라도 실행 안 됐을 경우를 대비해 호출

    // 모바일 메뉴 외부 클릭 시 닫기
    document.addEventListener('click', function (e) {
        const menu = document.getElementById('navMenu');
        const btn = document.querySelector('.mobile-btn');
        if (menu && menu.classList.contains('active')) {
            if (!menu.contains(e.target) && !btn.contains(e.target)) {
                menu.classList.remove('active');
            }
        }
    });
});