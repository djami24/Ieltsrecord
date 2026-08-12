function goBack() {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }

    window.location.href = 'main.html';
}

// в”Ђв”Ђ "DASTUR HAQIDA" MATNLARI в”Ђв”Ђ
// Admin panelda tahrirlanadigan matnlar shu yerdan o'qib olinadi.
// (js/about.js va admin.html shu bir xil ABOUT_CONTENT_KEY va standart
// qiymatlarni ishlatadi.)
const ABOUT_CONTENT_KEY = 'nylc_about_content';
const DEFAULT_ABOUT_CONTENT = {
    heroBadge: "Dastur haqida",
    heroTitle: "Jiddiy <em>IELTS o'sishi</em> uchun yaratilgan.",
    heroLead: "IELTS Tracker talabalar o'z natijalarini aniq ko'rishiga, zaif tomonlarini tezda aniqlab olishiga va birinchi mock testdan yakuniy imtihongacha izchil bo'lishiga yordam beradi.",
    card1Kicker: "Maqsad",
    card1Title: "Tayyorgarlikni o'lchanadigan qiling",
    card1Text: "Biz tarqoq test natijalarini aniq bir hikoyaga aylantiramiz, shunda talabalar va o'qituvchilar har haftada yaxshiroq qarorlar qabul qila olsin.",
    card2Kicker: "Nima uchun ishlaydi",
    card2Title: "Oddiy oqim, aniq fikr-mulohaza",
    card2Text: "Soniyalar ichida ball kiriting, grafikda tendensiyalarni kuzating va har test so'ng qisqa izoh qoldiring — maqsadli rivojlaning.",
    stat1Value: "4",
    stat1Label: "Asosiy ko'nikmalar kuzatiladi",
    stat2Value: "1",
    stat2Label: "Aniq rivojlanish jadvali",
    stat3Value: "∞",
    stat3Label: "Rivojlanish uchun imkoniyat",
};

function loadAboutContent() {
    let saved = {};
    try {
        saved = JSON.parse(localStorage.getItem(ABOUT_CONTENT_KEY) || '{}') || {};
    } catch {
        saved = {};
    }
    return Object.assign({}, DEFAULT_ABOUT_CONTENT, saved);
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function renderAboutContent() {
    const c = loadAboutContent();

    setText('aboutHeroBadge', c.heroBadge);
    const heroTitle = document.getElementById('aboutHeroTitle');
    if (heroTitle) heroTitle.innerHTML = c.heroTitle;
    setText('aboutHeroLead', c.heroLead);

    setText('aboutCard1Kicker', c.card1Kicker);
    setText('aboutCard1Title', c.card1Title);
    setText('aboutCard1Text', c.card1Text);
    setText('aboutCard2Kicker', c.card2Kicker);
    setText('aboutCard2Title', c.card2Title);
    setText('aboutCard2Text', c.card2Text);

    setText('aboutStat1Value', c.stat1Value);
    setText('aboutStat1Label', c.stat1Label);
    setText('aboutStat2Value', c.stat2Value);
    setText('aboutStat2Label', c.stat2Label);
    setText('aboutStat3Value', c.stat3Value);
    setText('aboutStat3Label', c.stat3Label);
}

renderAboutContent();
