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
    heroTitle: "IELTS <em>natijalarini</em> kuzatish va tahlil qilish uchun yaratilgan.",
    heroLead: "IELTS Tracker bu o‘quvchilarning mock test natijalarini saqlash, natijalarni kuzatish va vaqt davomida o‘zgarishlarni tahlil qilish uchun mo‘ljallangan platforma.",
    card1Kicker: "Maqsad",
    card1Title: "Natijalarni bir joyda saqlash va tahlil qilish",
    card1Text: "Har bir mock test (IELTS, CEFR) natijasi tizimga kiritiladi. O‘quvchining Listening, Reading, Writing va Speaking natijalari saqlanib, umumiy natijalar bilan birgalikda ko‘rsatiladi.",
    card2Kicker: "Qanday ishlaydi",
    card2Title: "Natija → Saqlash → Tahlil",
    card2Text: "O‘quvchi har bir testdan so‘ng o‘z natijalarini kiritadi. Tizim natijalarni tarix bo‘yicha saqlaydi va grafiklar orqali natijalardagi o‘zgarishlarni ko‘rsatadi. Saytning asosiy vazifasi: o‘quvchi va o‘qituvchiga IELTS va CEFR tayyorgarligi davomida natijalarni muntazam kuzatish va qaysi yo‘nalishda o‘sish yoki pasayish borligini ko‘rish imkonini berish.",
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
