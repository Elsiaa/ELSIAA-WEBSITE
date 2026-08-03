import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/*
  ELSIAA i18n — a runtime translator.
  One dictionary keyed by the English source string translates the whole
  rendered page from a single place (no per-component wiring). Unknown strings
  gracefully stay English. RTL is applied for Hebrew and Yiddish.

  Translation quality note: Hebrew and Yiddish were written with care but a
  native review is recommended before relying on them commercially.
*/

export type Lang = "en" | "es" | "fr" | "de" | "ru" | "nl" | "he" | "yi";

export const LANGS: Array<{ code: Lang; label: string; native: string; rtl?: boolean }> = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ru", label: "Russian", native: "Русский" },
  { code: "nl", label: "Flemish", native: "Vlaams" },
  { code: "he", label: "Hebrew", native: "עברית", rtl: true },
  { code: "yi", label: "Yiddish", native: "ייִדיש", rtl: true },
];

const RTL: Lang[] = ["he", "yi"];

// key = exact English string that appears in the DOM (trimmed).
type Row = Partial<Record<Lang, string>>;
const DICT: Record<string, Row> = {
  // ---- nav ----
  "Automate": { es: "Automatizar", fr: "Automatiser", de: "Automatisieren", ru: "Автоматизация", nl: "Automatiseren", he: "אוטומציה", yi: "אויטאָמאַטיזירן" },
  "Services": { es: "Servicios", fr: "Services", de: "Leistungen", ru: "Услуги", nl: "Diensten", he: "שירותים", yi: "סערוויסעס" },
  "Designs": { es: "Diseños", fr: "Créations", de: "Design", ru: "Дизайн", nl: "Ontwerpen", he: "עיצובים", yi: "דיזײַנען" },
  "Locations": { es: "Ubicaciones", fr: "Bureaux", de: "Standorte", ru: "Локации", nl: "Locaties", he: "מיקומים", yi: "ערטער" },
  "Contact Us": { es: "Contáctanos", fr: "Contact", de: "Kontakt", ru: "Связаться", nl: "Contact", he: "צור קשר", yi: "רופֿט אונדז" },
  "Get a Quote": { es: "Pedir presupuesto", fr: "Demander un devis", de: "Angebot anfordern", ru: "Получить смету", nl: "Offerte aanvragen", he: "קבלת הצעת מחיר", yi: "באַקומט אַן אָפֿער" },
  "Book a Call": { es: "Reservar una llamada", fr: "Réserver un appel", de: "Anruf buchen", ru: "Заказать звонок", nl: "Plan een gesprek", he: "לקביעת שיחה", yi: "פֿאַרשרײַבט אַ רוף" },
  "Home": { es: "Inicio", fr: "Accueil", de: "Start", ru: "Главная", nl: "Home", he: "בית", yi: "היים" },
  "Store": { es: "Tienda", fr: "Boutique", de: "Shop", ru: "Магазин", nl: "Winkel", he: "חנות", yi: "קלייט" },
  "Careers": { es: "Empleo", fr: "Carrières", de: "Karriere", ru: "Карьера", nl: "Vacatures", he: "קריירה", yi: "קאַריערעס" },
  "Team": { es: "Equipo", fr: "Équipe", de: "Team", ru: "Команда", nl: "Team", he: "צוות", yi: "מאַנשאַפֿט" },
  "Insights": { es: "Análisis", fr: "Analyses", de: "Einblicke", ru: "Аналитика", nl: "Inzichten", he: "תובנות", yi: "אײַנזיכטן" },
  "Search": { es: "Buscar", fr: "Recherche", de: "Suche", ru: "Поиск", nl: "Zoeken", he: "חיפוש", yi: "זוכן" },
  "Sign in": { es: "Iniciar sesión", fr: "Connexion", de: "Anmelden", ru: "Войти", nl: "Inloggen", he: "התחברות", yi: "אַרײַנלאָגירן" },
  "Client Login": { es: "Acceso clientes", fr: "Espace client", de: "Kundenlogin", ru: "Вход для клиентов", nl: "Klant-login", he: "כניסת לקוחות", yi: "קליענט־לאָגין" },
  "Menu": { es: "Menú", fr: "Menu", de: "Menü", ru: "Меню", nl: "Menu", he: "תפריט", yi: "מעניו" },
  "AI Done Better": { es: "IA hecha mejor", fr: "L'IA, en mieux", de: "KI besser gemacht", ru: "ИИ, сделанный лучше", nl: "AI, beter gedaan", he: "‏AI ברמה גבוהה יותר", yi: "‏AI בעסער געטאָן" },

  // ---- hero ----
  "Unlock the potential of your business with": {
    es: "Desbloquea el potencial de tu negocio con",
    fr: "Libérez le potentiel de votre entreprise avec",
    de: "Entfesseln Sie das Potenzial Ihres Unternehmens mit",
    ru: "Раскройте потенциал вашего бизнеса с помощью",
    nl: "Ontketen het potentieel van uw bedrijf met",
    he: "שחררו את הפוטנציאל של העסק שלכם עם",
    yi: "אַנטשליסט דעם פּאָטענציאַל פֿון אײַער געשעפֿט מיט",
  },
  "Why ELSIAA →": { es: "Por qué ELSIAA →", fr: "Pourquoi ELSIAA →", de: "Warum ELSIAA →", ru: "Почему ELSIAA →", nl: "Waarom ELSIAA →", he: "למה ELSIAA →", yi: "פֿאַרוואָס ELSIAA →" },
  "The world changed.": { es: "El mundo cambió.", fr: "Le monde a changé.", de: "Die Welt hat sich verändert.", ru: "Мир изменился.", nl: "De wereld is veranderd.", he: "העולם השתנה.", yi: "די וועלט האָט זיך געביטן." },
  "AI is here.": { es: "La IA ya está aquí.", fr: "L'IA est là.", de: "KI ist da.", ru: "ИИ уже здесь.", nl: "AI is er.", he: "‏AI כבר כאן.", yi: "‏AI איז שוין דאָ." },
  "Good artists don't use AI — they leverage it. World-class design for every surface of your business.": {
    es: "Los buenos artistas no usan la IA: la aprovechan. Diseño de primer nivel para cada superficie de tu negocio.",
    fr: "Les bons artistes n'utilisent pas l'IA : ils s'en servent comme levier. Un design de classe mondiale pour chaque surface de votre entreprise.",
    de: "Gute Künstler benutzen KI nicht — sie nutzen sie als Hebel. Weltklasse-Design für jede Fläche Ihres Unternehmens.",
    ru: "Хорошие художники не используют ИИ — они усиливают им себя. Дизайн мирового класса для каждой поверхности вашего бизнеса.",
    nl: "Goede kunstenaars gebruiken AI niet — ze benutten haar. Ontwerp van wereldklasse voor elk vlak van uw bedrijf.",
    he: "אמנים טובים לא משתמשים בבינה מלאכותית — הם ממנפים אותה. עיצוב ברמה עולמית לכל משטח בעסק שלך.",
    yi: "גוטע קינסטלער נוצן נישט קינסטלעכע אינטעליגענץ — זיי הייבן זיך דערמיט. וועלט־קלאַס דיזײַן פֿאַר יעדער פֿלאַך פֿון אײַער געשעפֿט.",
  },
  "Strategy, technology, business, product, growth — book a seat at the table.": {
    es: "Estrategia, tecnología, negocio, producto, crecimiento: reserva un lugar en la mesa.",
    fr: "Stratégie, technologie, business, produit, croissance — réservez votre place à la table.",
    de: "Strategie, Technologie, Business, Produkt, Wachstum — sichern Sie sich einen Platz am Tisch.",
    ru: "Стратегия, технологии, бизнес, продукт, рост — займите место за столом.",
    nl: "Strategie, technologie, business, product, groei — reserveer een plek aan tafel.",
    he: "אסטרטגיה, טכנולוגיה, עסק, מוצר, צמיחה — שריינו מקום ליד השולחן.",
    yi: "סטראַטעגיע, טעכנאָלאָגיע, ביזנעס, פּראָדוקט, וווּקס — פֿאַרשרײַבט אַ פּלאַץ בײַם טיש.",
  },
  "Book Consultation ↗": { es: "Reservar consultoría ↗", fr: "Réserver un conseil ↗", de: "Beratung buchen ↗", ru: "Записаться на консультацию ↗", nl: "Advies boeken ↗", he: "לקביעת ייעוץ ↗", yi: "פֿאַרשרײַבט אַ קאָנסולטאַציע ↗" },
  "Meet the leadership →": { es: "Conoce al equipo directivo →", fr: "Rencontrer la direction →", de: "Die Führung kennenlernen →", ru: "Познакомиться с руководством →", nl: "Ontmoet de leiding →", he: "להכיר את ההנהלה →", yi: "טרעפֿט די פֿירערשאַפֿט →" },
  "We put AI to work in your business — real automation, world-class design, custom software, and strategy that delivers results.": {
    es: "Ponemos la IA a trabajar en tu negocio: automatización real, diseño de primer nivel, software a medida y estrategia que da resultados.",
    fr: "Nous mettons l'IA au service de votre entreprise : automatisation réelle, design de classe mondiale, logiciels sur mesure et une stratégie qui produit des résultats.",
    de: "Wir setzen KI in Ihrem Unternehmen ein — echte Automatisierung, Weltklasse-Design, maßgeschneiderte Software und eine Strategie, die Ergebnisse liefert.",
    ru: "Мы внедряем ИИ в ваш бизнес — реальная автоматизация, дизайн мирового класса, индивидуальное ПО и стратегия, дающая результат.",
    nl: "Wij zetten AI aan het werk in uw bedrijf — echte automatisering, ontwerp van wereldklasse, software op maat en een strategie die resultaat levert.",
    he: "אנחנו מרתמים בינה מלאכותית לעסק שלך — אוטומציה אמיתית, עיצוב ברמה עולמית, תוכנה בהתאמה אישית ואסטרטגיה שמביאה תוצאות.",
    yi: "מיר שטעלן קינסטלעכע אינטעליגענץ צו דער אַרבעט אין אײַער געשעפֿט — עכטע אויטאָמאַטיזאַציע, וועלט־קלאַס דיזײַן, מיוחדע ווײַכווארג און אַ סטראַטעגיע וואָס ברענגט רעזולטאַטן.",
  },
  "78% of companies already run AI": { es: "El 78% de las empresas ya usan IA", fr: "78% des entreprises utilisent déjà l'IA", de: "78% der Unternehmen nutzen bereits KI", ru: "78% компаний уже используют ИИ", nl: "78% van de bedrijven gebruikt al AI", he: "‏78% מהחברות כבר מפעילות בינה מלאכותית", yi: "‏78% פֿון פֿירמעס נוצן שוין קינסטלעכע אינטעליגענץ" },
  "in at least one function.": { es: "en al menos una función.", fr: "dans au moins une fonction.", de: "in mindestens einem Bereich.", ru: "хотя бы в одной функции.", nl: "in ten minste één functie.", he: "בלפחות תחום אחד.", yi: "אין לפּחות איין פֿונקציע." },
  "The other 22% are competing against it.": { es: "El otro 22% compite contra ellas.", fr: "Les 22% restants les concurrencent.", de: "Die anderen 22% konkurrieren dagegen.", ru: "Остальные 22% конкурируют с ними.", nl: "De andere 22% concurreert ertegen.", he: "22% הנותרים מתחרים מולן.", yi: "די אַנדערע 22% קאָנקורירן קעגן זיי." },
  "Book Free 20-Min Strategy Call →": { es: "Reserva una llamada estratégica gratis de 20 min →", fr: "Réservez un appel stratégie gratuit de 20 min →", de: "Kostenloses 20-Min-Strategiegespräch buchen →", ru: "Бесплатный 20-мин стратегический звонок →", nl: "Boek een gratis strategiegesprek van 20 min →", he: "לקביעת שיחת אסטרטגיה חינם של 20 דק' →", yi: "פֿאַרשרײַבט אַ פֿרײַע 20-מינוט סטראַטעגיע רוף →" },
  "Cities on site": { es: "Ciudades presenciales", fr: "Villes sur place", de: "Städte vor Ort", ru: "Города присутствия", nl: "Steden ter plaatse", he: "ערים באתר", yi: "שטעט אויף אָרט" },
  "Continents": { es: "Continentes", fr: "Continents", de: "Kontinente", ru: "Континенты", nl: "Continenten", he: "יבשות", yi: "קאָנטינענטן" },
  "Support": { es: "Soporte", fr: "Assistance", de: "Support", ru: "Поддержка", nl: "Support", he: "תמיכה", yi: "שטיצע" },
  "Right now, while you read this": { es: "Ahora mismo, mientras lees esto", fr: "En ce moment, pendant que vous lisez ceci", de: "Genau jetzt, während Sie das lesen", ru: "Прямо сейчас, пока вы это читаете", nl: "Nu meteen, terwijl u dit leest", he: "ממש עכשיו, בזמן שאתה קורא את זה", yi: "פּונקט איצט, בעת איר לייענט דאָס" },
  "Read the research ↗": { es: "Leer la investigación ↗", fr: "Lire l'étude ↗", de: "Zur Studie ↗", ru: "Читать исследование ↗", nl: "Lees het onderzoek ↗", he: "לקריאת המחקר ↗", yi: "לייענט די פֿאָרשונג ↗" },

  // ---- why elsiaa ----
  "Why ELSIAA": { es: "Por qué ELSIAA", fr: "Pourquoi ELSIAA", de: "Warum ELSIAA", ru: "Почему ELSIAA", nl: "Waarom ELSIAA", he: "למה ELSIAA", yi: "פֿאַרוואָס ELSIAA" },
  "Built different.": { es: "Hecho diferente.", fr: "Conçu différemment.", de: "Anders gebaut.", ru: "Сделано иначе.", nl: "Anders gebouwd.", he: "בנוי אחרת.", yi: "אַנדערש געבויט." },
  "No bugs. No data hacks. Fully insured.": { es: "Sin errores. Sin filtraciones. Totalmente asegurado.", fr: "Aucun bug. Aucune fuite de données. Entièrement assuré.", de: "Keine Bugs. Keine Datenlecks. Voll versichert.", ru: "Без багов. Без утечек данных. Полностью застраховано.", nl: "Geen bugs. Geen datalekken. Volledig verzekerd.", he: "בלי באגים. בלי דליפות מידע. מבוטח לחלוטין.", yi: "קיין באַגס. קיין דאַטן־לעקן. פֿול פֿאַרזיכערט." },
  "Outcomes, not experiments.": { es: "Resultados, no experimentos.", fr: "Des résultats, pas des expériences.", de: "Ergebnisse, keine Experimente.", ru: "Результаты, а не эксперименты.", nl: "Resultaten, geen experimenten.", he: "תוצאות, לא ניסויים.", yi: "רעזולטאַטן, נישט עקספּערימענטן." },

  // ---- automate section ----
  "01 · Division · Automation & Software": { es: "01 · División · Automatización y Software", fr: "01 · Division · Automatisation et Logiciel", de: "01 · Bereich · Automatisierung & Software", ru: "01 · Направление · Автоматизация и ПО", nl: "01 · Divisie · Automatisering & Software", he: "01 · תחום · אוטומציה ותוכנה", yi: "01 · אָפּטייל · אויטאָמאַטיזאַציע און ווײַכווארג" },
  "Don't take our word for it. Walk through what we actually ship.": {
    es: "No te fíes de nuestra palabra. Recorre lo que de verdad entregamos.",
    fr: "Ne nous croyez pas sur parole. Parcourez ce que nous livrons vraiment.",
    de: "Verlassen Sie sich nicht auf unser Wort. Sehen Sie, was wir tatsächlich liefern.",
    ru: "Не верьте на слово. Пройдитесь по тому, что мы действительно поставляем.",
    nl: "Geloof ons niet op ons woord. Loop door wat we echt opleveren.",
    he: "אל תסתמכו רק על המילה שלנו. עברו על מה שאנחנו באמת מספקים.",
    yi: "גלייבט אונדז נישט אויפֿן וואָרט. גייט דורך וואָס מיר ליפֿערן טאַקע.",
  },
  "Custom software and AI systems built to run a business — not sit beside it.": {
    es: "Software a medida y sistemas de IA hechos para dirigir un negocio, no para acompañarlo.",
    fr: "Des logiciels sur mesure et des systèmes d'IA conçus pour faire tourner une entreprise, pas pour la côtoyer.",
    de: "Maßgeschneiderte Software und KI-Systeme, die ein Unternehmen führen — nicht danebenstehen.",
    ru: "Индивидуальное ПО и системы ИИ, созданные, чтобы управлять бизнесом, а не стоять рядом.",
    nl: "Software op maat en AI-systemen gebouwd om een bedrijf te runnen — niet om ernaast te staan.",
    he: "תוכנה בהתאמה אישית ומערכות בינה מלאכותית שנבנו כדי להריץ עסק — לא לשבת לצידו.",
    yi: "מיוחדע ווײַכווארג און קינסטלעכע־אינטעליגענץ סיסטעמען געבויט צו פֿירן אַ געשעפֿט — נישט צו שטיין דערבײַ.",
  },
  "Client names, data, and branding shown here have been changed or removed to protect privacy.": {
    es: "Los nombres de clientes, datos y marcas mostrados aquí se han modificado o eliminado para proteger la privacidad.",
    fr: "Les noms de clients, données et marques présentés ici ont été modifiés ou supprimés pour protéger la confidentialité.",
    de: "Kundennamen, Daten und Marken in dieser Darstellung wurden zum Schutz der Privatsphäre geändert oder entfernt.",
    ru: "Имена клиентов, данные и бренды здесь изменены или удалены для защиты конфиденциальности.",
    nl: "Klantnamen, gegevens en merken die hier worden getoond zijn gewijzigd of verwijderd om de privacy te beschermen.",
    he: "שמות לקוחות, נתונים ומיתוג המוצגים כאן שונו או הוסרו כדי להגן על הפרטיות.",
    yi: "קליענט־נעמען, דאַטן און בראַנדינג וואָס ווערן דאָ געוויזן זײַנען געביטן אָדער אַוועקגענומען צו באַשיצן פּריוואַטקייט.",
  },
  "Everything the division ships": { es: "Todo lo que entrega la división", fr: "Tout ce que livre la division", de: "Alles, was der Bereich liefert", ru: "Всё, что поставляет направление", nl: "Alles wat de divisie levert", he: "כל מה שהתחום מספק", yi: "אַלץ וואָס דער אָפּטייל ליפֿערט" },
  "Explore Services →": { es: "Explorar servicios →", fr: "Découvrir les services →", de: "Leistungen entdecken →", ru: "Смотреть услуги →", nl: "Ontdek diensten →", he: "לצפייה בשירותים →", yi: "אויספֿאָרשן סערוויסעס →" },
  "See it run live ↗": { es: "Verlo en vivo ↗", fr: "Le voir en direct ↗", de: "Live ansehen ↗", ru: "Смотреть вживую ↗", nl: "Bekijk het live ↗", he: "לצפייה בהדגמה חיה ↗", yi: "זעט עס לעבעדיק ↗" },
  "Request a walkthrough": { es: "Solicitar una demostración", fr: "Demander une démonstration", de: "Rundgang anfragen", ru: "Запросить демонстрацию", nl: "Vraag een rondleiding aan", he: "לבקשת הדגמה", yi: "בעטן אַ דורכגאַנג" },
  "Open the live demo": { es: "Abrir la demo en vivo", fr: "Ouvrir la démo en direct", de: "Live-Demo öffnen", ru: "Открыть живое демо", nl: "Open de live demo", he: "לפתיחת ההדגמה החיה", yi: "עפֿן די לעבעדיקע דעמאָ" },
  "Before": { es: "Antes", fr: "Avant", de: "Vorher", ru: "До", nl: "Voor", he: "לפני", yi: "פֿאַר" },
  "After": { es: "Después", fr: "Après", de: "Nachher", ru: "После", nl: "Na", he: "אחרי", yi: "נאָך" },

  // ---- home automation section (two-column) ----
  "01 · Automation": { es: "01 · Automatización", fr: "01 · Automatisation", de: "01 · Automatisierung", ru: "01 · Автоматизация", nl: "01 · Automatisering", he: "01 · אוטומציה", yi: "01 · אויטאָמאַטיזאַציע" },
  "One worker.": { es: "Un solo trabajador.", fr: "Un seul ouvrier.", de: "Ein Mitarbeiter.", ru: "Один работник.", nl: "Eén werker.", he: "עובד אחד.", yi: "איין אַרבעטער." },
  "Every task at once.": { es: "Todas las tareas a la vez.", fr: "Toutes les tâches à la fois.", de: "Jede Aufgabe zugleich.", ru: "Все задачи сразу.", nl: "Elke taak tegelijk.", he: "כל משימה בבת אחת.", yi: "יעדע אויפֿגאַבע אויף איין מאָל." },
  "Work that used to need people — sales, operations, finance, support — runs end to end, and proven before you commit a dollar.": {
    es: "El trabajo que antes requería personas —ventas, operaciones, finanzas, soporte— funciona de principio a fin, y probado antes de que inviertas un dólar.",
    fr: "Le travail qui exigeait des personnes — ventes, opérations, finance, support — tourne de bout en bout, et prouvé avant que vous n'engagiez un dollar.",
    de: "Arbeit, die früher Menschen brauchte — Vertrieb, Betrieb, Finanzen, Support — läuft von Anfang bis Ende, und bewiesen, bevor Sie einen Dollar investieren.",
    ru: "Работа, которая раньше требовала людей — продажи, операции, финансы, поддержка — выполняется от начала до конца, и доказано до того, как вы вложите доллар.",
    nl: "Werk waarvoor vroeger mensen nodig waren — verkoop, operatie, financiën, support — loopt van begin tot eind, en bewezen voordat u een dollar uitgeeft.",
    he: "עבודה שפעם דרשה אנשים — מכירות, תפעול, פיננסים, תמיכה — רצה מקצה לקצה, ומוכחת עוד לפני שתשקיע דולר.",
    yi: "אַרבעט וואָס האָט אַמאָל געדאַרפֿט מענטשן — פֿאַרקויף, אָפּעראַציעס, פֿינאַנצן, שטיצע — לויפֿט פֿון אָנהייב ביזן סוף, און באַוויזן איידער איר גיט אַרויס אַ דאָלאַר.",
  },
  "Runs 24/7": { es: "Funciona 24/7", fr: "Fonctionne 24/7", de: "Läuft rund um die Uhr", ru: "Работает 24/7", nl: "Draait 24/7", he: "פועל 24/7", yi: "לויפֿט 24/7" },
  "83% of calls handled": { es: "83% de llamadas atendidas", fr: "83% des appels traités", de: "83% der Anrufe bearbeitet", ru: "83% звонков обработано", nl: "83% van de oproepen afgehandeld", he: "‏83% מהשיחות טופלו", yi: "‏83% פֿון רופֿן באַהאַנדלט" },
  "41s to booked": { es: "41s hasta la reserva", fr: "41s jusqu'à la réservation", de: "41 Sek. bis zur Buchung", ru: "41с до брони", nl: "41s tot geboekt", he: "41 שנ׳ עד להזמנה", yi: "41 סעק ביז פֿאַרשריבן" },
  "Discover automations →": { es: "Descubre las automatizaciones →", fr: "Découvrir les automatisations →", de: "Automatisierungen entdecken →", ru: "Открыть автоматизации →", nl: "Ontdek automatiseringen →", he: "לגלות אוטומציות →", yi: "אַנטדעקט אויטאָמאַטיזאַציעס →" },
  "See it work — live walkthrough →": { es: "Míralo funcionar — recorrido en vivo →", fr: "Voyez-le à l'œuvre — démonstration en direct →", de: "Sehen Sie es in Aktion — Live-Rundgang →", ru: "Посмотрите в действии — живой обзор →", nl: "Zie het werken — live rondleiding →", he: "לראות את זה עובד — סיור חי →", yi: "זעט עס אַרבעטן — לעבעדיקער דורכגאַנג →" },

  // ---- shared chrome: nav + footer + CTAs (visible on every page) ----
  "Contact": { es: "Contacto", fr: "Contact", de: "Kontakt", ru: "Контакты", nl: "Contact", he: "צור קשר", yi: "רופֿט אונדז" },
  "Clients": { es: "Clientes", fr: "Clients", de: "Kunden", ru: "Клиенты", nl: "Klanten", he: "לקוחות", yi: "קליענטן" },
  "Get a quote": { es: "Pedir presupuesto", fr: "Demander un devis", de: "Angebot anfordern", ru: "Получить смету", nl: "Offerte aanvragen", he: "קבלת הצעת מחיר", yi: "באַקומט אַן אָפֿער" },
  "Get a quote →": { es: "Pedir presupuesto →", fr: "Demander un devis →", de: "Angebot anfordern →", ru: "Получить смету →", nl: "Offerte aanvragen →", he: "קבלת הצעת מחיר →", yi: "באַקומט אַן אָפֿער →" },
  "Book a call": { es: "Reservar una llamada", fr: "Réserver un appel", de: "Anruf buchen", ru: "Заказать звонок", nl: "Plan een gesprek", he: "לקביעת שיחה", yi: "פֿאַרשרײַבט אַ רוף" },
  "Book a call →": { es: "Reservar una llamada →", fr: "Réserver un appel →", de: "Anruf buchen →", ru: "Заказать звонок →", nl: "Plan een gesprek →", he: "לקביעת שיחה →", yi: "פֿאַרשרײַבט אַ רוף →" },
  "New client — start here": { es: "Cliente nuevo — empieza aquí", fr: "Nouveau client — commencez ici", de: "Neukunde — hier starten", ru: "Новый клиент — начните здесь", nl: "Nieuwe klant — begin hier", he: "לקוח חדש — התחילו כאן", yi: "נײַער קליענט — הייבט אָן דאָ" },
  "The process →": { es: "El proceso →", fr: "Le processus →", de: "Der Ablauf →", ru: "Как мы работаем →", nl: "Het proces →", he: "התהליך →", yi: "דער פּראָצעס →" },
  "Existing client — Sign in": { es: "Cliente actual — Iniciar sesión", fr: "Client existant — Connexion", de: "Bestandskunde — Anmelden", ru: "Действующий клиент — Войти", nl: "Bestaande klant — Inloggen", he: "לקוח קיים — התחברות", yi: "יעצטיקער קליענט — אַרײַנלאָגירן" },
  "Sign in →": { es: "Iniciar sesión →", fr: "Connexion →", de: "Anmelden →", ru: "Войти →", nl: "Inloggen →", he: "התחברות →", yi: "אַרײַנלאָגירן →" },
  "Direct": { es: "Directo", fr: "Direct", de: "Direkt", ru: "Напрямую", nl: "Direct", he: "ישיר", yi: "דירעקט" },
  "Offices": { es: "Oficinas", fr: "Bureaux", de: "Standorte", ru: "Офисы", nl: "Kantoren", he: "משרדים", yi: "אָפֿיסן" },
  "Client login": { es: "Acceso clientes", fr: "Espace client", de: "Kundenlogin", ru: "Вход для клиентов", nl: "Klant-login", he: "כניסת לקוחות", yi: "קליענט־לאָגין" },
  "Speak to ELSIAA today →": { es: "Habla con ELSIAA hoy →", fr: "Parlez à ELSIAA aujourd'hui →", de: "Sprechen Sie noch heute mit ELSIAA →", ru: "Свяжитесь с ELSIAA сегодня →", nl: "Praat vandaag met ELSIAA →", he: "דברו עם ELSIAA היום →", yi: "רעדט מיט ELSIAA הײַנט →" },
  "ELSIAA + AI, together.": { es: "ELSIAA + IA, juntos.", fr: "ELSIAA + IA, ensemble.", de: "ELSIAA + KI, gemeinsam.", ru: "ELSIAA + ИИ, вместе.", nl: "ELSIAA + AI, samen.", he: "‏ELSIAA + AI, יחד.", yi: "‏ELSIAA + AI, צוזאַמען." },
  "We put AI to work where it earns its place — and prove the result before you commit a dollar.": {
    es: "Ponemos la IA a trabajar donde se gana su lugar, y probamos el resultado antes de que inviertas un dólar.",
    fr: "Nous mettons l'IA au travail là où elle mérite sa place — et nous prouvons le résultat avant que vous n'engagiez un dollar.",
    de: "Wir setzen KI dort ein, wo sie sich ihren Platz verdient — und beweisen das Ergebnis, bevor Sie einen Dollar investieren.",
    ru: "Мы применяем ИИ там, где он оправдан, и доказываем результат до того, как вы вложите доллар.",
    nl: "Wij zetten AI in waar het zijn plek verdient — en bewijzen het resultaat voordat u een dollar uitgeeft.",
    he: "אנחנו מפעילים בינה מלאכותית במקום שבו היא מוכיחה את עצמה — ומראים את התוצאה עוד לפני שתשקיע דולר.",
    yi: "מיר שטעלן קינסטלעכע אינטעליגענץ צו דער אַרבעט וווּ זי פֿאַרדינט איר אָרט — און באַווײַזן דעם רעזולטאַט איידער איר גיט אַרויס אַ דאָלאַר.",
  },

  // ---- home: automation catalog intro + category headers ----
  "Everything we can automate — and build to run it.": {
    es: "Todo lo que podemos automatizar — y construir para que funcione.",
    fr: "Tout ce que nous pouvons automatiser — et construire pour le faire tourner.",
    de: "Alles, was wir automatisieren können — und bauen, damit es läuft.",
    ru: "Всё, что мы можем автоматизировать — и построить, чтобы это работало.",
    nl: "Alles wat we kunnen automatiseren — en bouwen om het te laten draaien.",
    he: "כל מה שאפשר להפוך לאוטומטי — ולבנות כדי שירוץ.",
    yi: "אַלץ וואָס מיר קענען אויטאָמאַטיזירן — און בויען עס צו לויפֿן.",
  },
  "Sales, operations, finance, support — from the first wireframe to the cloud it runs on.": {
    es: "Ventas, operaciones, finanzas, soporte: desde el primer wireframe hasta la nube en la que funciona.",
    fr: "Ventes, opérations, finance, support — du premier wireframe jusqu'au cloud qui l'héberge.",
    de: "Vertrieb, Betrieb, Finanzen, Support — vom ersten Wireframe bis zur Cloud, auf der es läuft.",
    ru: "Продажи, операции, финансы, поддержка — от первого wireframe до облака, в котором всё работает.",
    nl: "Verkoop, operatie, financiën, support — van het eerste wireframe tot de cloud waarop het draait.",
    he: "מכירות, תפעול, פיננסים, תמיכה — מהסקיצה הראשונה ועד הענן שעליו זה רץ.",
    yi: "פֿאַרקויף, אָפּעראַציעס, פֿינאַנצן, שטיצע — פֿון ערשטן ווײַערפֿרעם ביזן וואָלקן וווּ עס לויפֿט.",
  },
  "Sales": { es: "Ventas", fr: "Ventes", de: "Vertrieb", ru: "Продажи", nl: "Verkoop", he: "מכירות", yi: "פֿאַרקויף" },
  "Operations": { es: "Operaciones", fr: "Opérations", de: "Betrieb", ru: "Операции", nl: "Operatie", he: "תפעול", yi: "אָפּעראַציעס" },
  "Customer Support": { es: "Atención al cliente", fr: "Support client", de: "Kundensupport", ru: "Поддержка клиентов", nl: "Klantenservice", he: "תמיכת לקוחות", yi: "קליענט־שטיצע" },
  "Finance": { es: "Finanzas", fr: "Finance", de: "Finanzen", ru: "Финансы", nl: "Financiën", he: "פיננסים", yi: "פֿינאַנצן" },
  "Marketing": { es: "Marketing", fr: "Marketing", de: "Marketing", ru: "Маркетинг", nl: "Marketing", he: "שיווק", yi: "מאַרקעטינג" },
  "HR": { es: "RR. HH.", fr: "RH", de: "Personal", ru: "HR", nl: "HR", he: "משאבי אנוש", yi: "מענטש־רעסורסן" },
  "Web": { es: "Web", fr: "Web", de: "Web", ru: "Веб", nl: "Web", he: "אינטרנט", yi: "וועב" },
  "Mobile": { es: "Móvil", fr: "Mobile", de: "Mobil", ru: "Мобайл", nl: "Mobiel", he: "מובייל", yi: "מאָביל" },

  // ---- divisions ----
  "Design": { es: "Diseño", fr: "Design", de: "Design", ru: "Дизайн", nl: "Ontwerp", he: "עיצוב", yi: "דיזײַן" },
  "Consultation": { es: "Consultoría", fr: "Conseil", de: "Beratung", ru: "Консалтинг", nl: "Advies", he: "ייעוץ", yi: "קאָנסולטאַציע" },
  "Explore Designs ↗": { es: "Explorar diseños ↗", fr: "Découvrir les créations ↗", de: "Designs entdecken ↗", ru: "Смотреть дизайн ↗", nl: "Ontdek ontwerpen ↗", he: "לצפייה בעיצובים ↗", yi: "אויספֿאָרשן דיזײַנען ↗" },

  // ---- designs opener ----
  "What's the world without art but a rock?": { es: "¿Qué es el mundo sin arte, sino una roca?", fr: "Qu'est le monde sans l'art, sinon un caillou ?", de: "Was ist die Welt ohne Kunst außer einem Felsen?", ru: "Что такое мир без искусства, как не камень?", nl: "Wat is de wereld zonder kunst, behalve een rots?", he: "מהו העולם בלי אמנות, אם לא סלע?", yi: "וואָס איז די וועלט אָן קונסט, אַחוץ אַ שטיין?" },
  "Because how boring would that be.": { es: "Porque qué aburrido sería eso.", fr: "Parce que ce serait bien ennuyeux.", de: "Denn wie langweilig wäre das.", ru: "Ведь как это было бы скучно.", nl: "Want wat zou dat saai zijn.", he: "כי כמה משעמם זה היה.", yi: "ווײַל ווי נודנע דאָס וואָלט געווען." },
  "Continue": { es: "Continuar", fr: "Continuer", de: "Weiter", ru: "Далее", nl: "Verder", he: "המשך", yi: "ווײַטער" },

  // ---- footer / final ----
  "The world changed. Your business should too.": { es: "El mundo cambió. Tu negocio también debería.", fr: "Le monde a changé. Votre entreprise aussi devrait.", de: "Die Welt hat sich verändert. Ihr Unternehmen sollte das auch.", ru: "Мир изменился. Ваш бизнес тоже должен.", nl: "De wereld is veranderd. Uw bedrijf zou dat ook moeten.", he: "העולם השתנה. גם העסק שלך צריך.", yi: "די וועלט האָט זיך געביטן. אײַער געשעפֿט זאָל אויך." },
  "All rights reserved.": { es: "Todos los derechos reservados.", fr: "Tous droits réservés.", de: "Alle Rechte vorbehalten.", ru: "Все права защищены.", nl: "Alle rechten voorbehouden.", he: "כל הזכויות שמורות.", yi: "אַלע רעכט פֿאַרהיט." },
  "Privacy Policy": { es: "Política de privacidad", fr: "Politique de confidentialité", de: "Datenschutz", ru: "Политика конфиденциальности", nl: "Privacybeleid", he: "מדיניות פרטיות", yi: "פּריוואַטקייט־פּאָליטיק" },
  "Terms of Service": { es: "Términos del servicio", fr: "Conditions d'utilisation", de: "Nutzungsbedingungen", ru: "Условия использования", nl: "Servicevoorwaarden", he: "תנאי שימוש", yi: "באַניץ־תּנאָים" },

  // ---- site-wide coverage: services, contact, consultation, why, team, careers ----
  "A clear plan and price within three days.": { es: "Un plan y un precio claros en tres días.", fr: "Un plan et un prix clairs sous trois jours.", de: "Ein klarer Plan und Preis innerhalb von drei Tagen.", ru: "Чёткий план и цена в течение трёх дней.", nl: "Een duidelijk plan en prijs binnen drie dagen.", he: "תוכנית ומחיר ברורים תוך שלושה ימים.", yi: "אַ קלאָרער פּלאַן און פּרײַז אין דרײַ טעג אַרום." },
  "A full hour with a specialist. You leave with a clear plan of what to do next.": { es: "Una hora completa con un especialista. Sales con un plan claro de los siguientes pasos.", fr: "Une heure complète avec un spécialiste. Vous repartez avec un plan d'action clair.", de: "Eine volle Stunde mit einem Spezialisten. Sie gehen mit einem klaren Plan für die nächsten Schritte.", ru: "Полный час со специалистом. Вы уходите с чётким планом дальнейших действий.", nl: "Een volledig uur met een specialist. U vertrekt met een duidelijk plan voor de volgende stappen.", he: "שעה מלאה עם מומחה. יוצאים עם תוכנית ברורה לצעדים הבאים.", yi: "אַ פֿולע שעה מיט אַ ספּעציאַליסט. איר גייט אַוועק מיט אַ קלאָרן פּלאַן וואָס צו טאָן ווײַטער." },
  "A site built to convert — designed, written, and shipped live.": { es: "Un sitio creado para convertir — diseñado, redactado y puesto en marcha.", fr: "Un site conçu pour convertir — design, rédaction et mise en ligne.", de: "Eine Website, die konvertiert — gestaltet, getextet und live gestellt.", ru: "Сайт, созданный для конверсии — спроектирован, наполнен текстами и запущен.", nl: "Een site gebouwd om te converteren — ontworpen, geschreven en live gezet.", he: "אתר שנבנה כדי להמיר — מעוצב, כתוב ועולה לאוויר.", yi: "אַ וועבזײַט געבויט צו פֿאַרוואַנדלען באַזוכער אין קונים — אויסגעפֿורעמט, אָנגעשריבן, און לעבעדיק אַרויסגעלאָזט." },
  "AI & Technology Expert": { es: "Experto en IA y Tecnología", fr: "Expert en IA et en technologies", de: "KI- & Technologieexperte", ru: "Эксперт по ИИ и технологиям", nl: "AI- & Technologie-expert", he: "מומחה AI וטכנולוגיה", yi: "מומחה אויף קינסטלעכער אינטעליגענץ און טעכנאָלאָגיע" },
  "AI maximised by a professional team": { es: "IA aprovechada al máximo por un equipo profesional", fr: "L'IA exploitée au maximum par une équipe professionnelle", de: "KI, von einem professionellen Team maximal ausgeschöpft", ru: "Максимальная отдача от ИИ — силами профессиональной команды", nl: "AI maximaal benut door een professioneel team", he: "AI שממוצה עד תום בידי צוות מקצועי", yi: "קינסטלעכע אינטעליגענץ אויסגענוצט צום מאַקסימום דורך אַ פּראָפֿעסיאָנעלן טעאַם" },
  "About ELSIAA": { es: "Sobre ELSIAA", fr: "À propos d'ELSIAA", de: "Über ELSIAA", ru: "Об ELSIAA", nl: "Over ELSIAA", he: "אודות ELSIAA", yi: "וועגן ELSIAA" },
  "Application": { es: "Solicitud", fr: "Candidature", de: "Bewerbung", ru: "Заявка", nl: "Sollicitatie", he: "מועמדות", yi: "אַפּליקאַציע" },
  "Application submitted": { es: "Solicitud enviada", fr: "Candidature envoyée", de: "Bewerbung eingereicht", ru: "Заявка отправлена", nl: "Sollicitatie verstuurd", he: "המועמדות נשלחה", yi: "אַפּליקאַציע אײַנגעגעבן" },
  "Apply to ELSIAA": { es: "Postúlate a ELSIAA", fr: "Postuler chez ELSIAA", de: "Bei ELSIAA bewerben", ru: "Подать заявку в ELSIAA", nl: "Solliciteer bij ELSIAA", he: "הגשת מועמדות ל־ELSIAA", yi: "מעלדט זיך אָן צו ELSIAA" },
  "Apply →": { es: "Postúlate →", fr: "Postuler →", de: "Bewerben →", ru: "Откликнуться →", nl: "Solliciteer →", he: "להגשת מועמדות →", yi: "מעלדט זיך אָן →" },
  "Areas of interest": { es: "Áreas de interés", fr: "Domaines d'intérêt", de: "Interessensbereiche", ru: "Интересующие направления", nl: "Interessegebieden", he: "תחומי עניין", yi: "געביטן פֿון אינטערעס" },
  "Areas of interest — select all that apply": { es: "Áreas de interés — selecciona todas las que correspondan", fr: "Domaines d'intérêt — sélectionnez toutes les options pertinentes", de: "Interessensbereiche — Mehrfachauswahl möglich", ru: "Интересующие направления — выберите все подходящие", nl: "Interessegebieden — selecteer alles wat van toepassing is", he: "תחומי עניין — סמנו כל מה שרלוונטי", yi: "געביטן פֿון אינטערעס — קלײַבט אויס אַלע וואָס פּאַסן" },
  "At the edge of applied AI — the deep-tech eye on every architecture ELSIAA ships.": { es: "En la vanguardia de la IA aplicada — la mirada deep-tech sobre cada arquitectura que ELSIAA entrega.", fr: "À la pointe de l'IA appliquée — le regard deep tech sur chaque architecture livrée par ELSIAA.", de: "An der Spitze der angewandten KI — der Deep-Tech-Blick auf jede Architektur, die ELSIAA ausliefert.", ru: "На переднем крае прикладного ИИ — глубокая техническая экспертиза в каждой архитектуре, которую выпускает ELSIAA.", nl: "Aan de rand van toegepaste AI — het deep-tech oog op elke architectuur die ELSIAA oplevert.", he: "בחזית ה־AI היישומי — העין הטכנולוגית העמוקה על כל ארכיטקטורה ש־ELSIAA מוציאה לאוויר.", yi: "בײַם ראַנד פֿון אָנגעווענדטער קינסטלעכער אינטעליגענץ — דאָס טיף־טעכנישע אויג אויף יעדער אַרכיטעקטור וואָס ELSIAA לאָזט אַרויס." },
  "Backend Software": { es: "Software Backend", fr: "Logiciels backend", de: "Backend-Software", ru: "Серверное ПО", nl: "Backendsoftware", he: "מערכות בקאנד", yi: "באַקענד־סאָפֿטווער" },
  "Book the hour": { es: "Reserva la hora", fr: "Réserver l'heure", de: "Stunde buchen", ru: "Забронировать час", nl: "Boek het uur", he: "להזמנת השעה", yi: "באַשטעלט די שעה" },
  "Book with": { es: "Reserva con", fr: "Réserver avec", de: "Buchen mit", ru: "Записаться к", nl: "Boek met", he: "הזמנה באמצעות", yi: "באַשטעלט מיט" },
  "Bring us the work that has to be right.": { es: "Tráenos el trabajo que no puede salir mal.", fr: "Confiez-nous les projets qui ne tolèrent aucune erreur.", de: "Bringen Sie uns die Arbeit, die sitzen muss.", ru: "Доверьте нам работу, которая должна быть безупречной.", nl: "Breng ons het werk dat juist moet zijn.", he: "הביאו אלינו את העבודה שחייבת להיות מדויקת.", yi: "ברענגט אונדז די אַרבעט וואָס מוז זײַן ריכטיק." },
  "Build production-grade AI systems that set the standard.": { es: "Construye sistemas de IA de nivel producción que marcan el estándar.", fr: "Construisez des systèmes d'IA de niveau production qui font référence.", de: "Entwickeln Sie produktionsreife KI-Systeme, die den Standard setzen.", ru: "Создавайте промышленные ИИ-системы, которые задают стандарт.", nl: "Bouw AI-systemen van productiekwaliteit die de standaard bepalen.", he: "בנו מערכות AI ברמת ייצור שמציבות את הסטנדרט.", yi: "בויט פּראָדוקציע־קלאַסיקע סיסטעמען פֿון קינסטלעכער אינטעליגענץ וואָס שטעלן דעם סטאַנדאַרט." },
  "Business Operations": { es: "Operaciones de Negocio", fr: "Opérations", de: "Geschäftsbetrieb", ru: "Операционная деятельность", nl: "Bedrijfsvoering", he: "תפעול עסקי", yi: "געשעפֿט־אָפּעראַציעס" },
  "Cities on the ground": { es: "Ciudades con presencia", fr: "Villes d'implantation", de: "Städte vor Ort", ru: "Городов присутствия", nl: "Steden ter plaatse", he: "ערים עם נוכחות בשטח", yi: "שטעט אויפֿן אָרט" },
  "Client & Sales": { es: "Clientes y Ventas", fr: "Clients et ventes", de: "Kunden & Vertrieb", ru: "Клиенты и продажи", nl: "Klanten & Sales", he: "לקוחות ומכירות", yi: "קונים און פֿאַרקויף" },
  "Client Engagement & Sales": { es: "Relación con Clientes y Ventas", fr: "Relation client et ventes", de: "Kundenbetreuung & Vertrieb", ru: "Работа с клиентами и продажи", nl: "Klantenrelaties & Sales", he: "קשרי לקוחות ומכירות", yi: "קונים־באַציִונגען און פֿאַרקויף" },
  "Co-Founder & CTO": { es: "Cofundador y CTO", fr: "Cofondateur et CTO", de: "Mitgründer & CTO", ru: "Сооснователь и технический директор", nl: "Medeoprichter & CTO", he: "שותף מייסד וסמנכ\"ל טכנולוגיות", yi: "מיט־גרינדער און הויפּט־טעכנאָלאָגיע־דירעקטאָר" },
  "Come build the real thing.": { es: "Ven a construir algo real.", fr: "Venez construire ce qui compte vraiment.", de: "Bauen Sie mit uns echte Systeme.", ru: "Создавайте вместе с нами то, что действительно работает.", nl: "Kom het echte werk bouwen.", he: "בואו לבנות את הדבר האמיתי.", yi: "קומט בויען די עכטע זאַך." },
  "Contracts, process, and operational excellence.": { es: "Contratos, procesos y excelencia operativa.", fr: "Contrats, processus et excellence opérationnelle.", de: "Verträge, Prozesse und operative Exzellenz.", ru: "Договоры, процессы и операционное совершенство.", nl: "Contracten, processen en operationele excellentie.", he: "חוזים, תהליכים ומצוינות תפעולית.", yi: "קאָנטראַקטן, פּראָצעס, און אָפּעראַציאָנעלע פֿאָרטרעפֿלעכקייט." },
  "Designed and built, reviewed as we go.": { es: "Diseñado y construido, con revisiones sobre la marcha.", fr: "Conçu et développé, avec une validation à chaque étape.", de: "Entworfen und gebaut, laufend gemeinsam geprüft.", ru: "Проектируем и разрабатываем, согласовывая по ходу работы.", nl: "Ontworpen en gebouwd, gaandeweg samen geëvalueerd.", he: "מעוצב ונבנה, עם בקרה לאורך הדרך.", yi: "אויסגעפֿורעמט און געבויט, איבערגעקוקט אויף יעדן טריט." },
  "Direct access.": { es: "Acceso directo.", fr: "Accès direct.", de: "Direkter Zugang.", ru: "Прямой доступ.", nl: "Rechtstreekse toegang.", he: "גישה ישירה.", yi: "דירעקטער צוטריט." },
  "Director, California Business": { es: "Director de Negocio, California", fr: "Directeur des activités en Californie", de: "Leiter, Geschäft Kalifornien", ru: "Директор по бизнесу в Калифорнии", nl: "Directeur, Californië", he: "מנהל פעילות קליפורניה", yi: "דירעקטאָר, קאַליפֿאָרניער געשעפֿט" },
  "Drag your résumé here": { es: "Arrastra tu CV aquí", fr: "Déposez votre CV ici", de: "Lebenslauf hierher ziehen", ru: "Перетащите сюда своё резюме", nl: "Sleep uw cv hierheen", he: "גררו לכאן את קורות החיים", yi: "שלעפּט אַהער אײַער רעזומע" },
  "Engineers who build at the frontier of AI.": { es: "Ingenieros que construyen en la frontera de la IA.", fr: "Des ingénieurs qui construisent à la pointe de l'IA.", de: "Ingenieure, die an der Spitze der KI entwickeln.", ru: "Инженеры, работающие на переднем крае ИИ.", nl: "Ingenieurs die bouwen aan de voorhoede van AI.", he: "מהנדסים שבונים בחזית ה־AI.", yi: "אינזשענירן וואָס בויען אויף דער פֿראָנט־ליניע פֿון קינסטלעכער אינטעליגענץ." },
  "Exactly. That is why we partner with you.": { es: "Exacto. Por eso nos asociamos contigo.", fr: "Exactement. C'est précisément pourquoi nous travaillons en partenariat avec vous.", de: "Genau. Deshalb arbeiten wir partnerschaftlich mit Ihnen.", ru: "Именно так. Поэтому мы работаем с вами в партнёрстве.", nl: "Precies. Daarom werken wij samen met u.", he: "בדיוק. בגלל זה אנחנו נכנסים איתכם לשותפות.", yi: "פּונקט אַזוי. דערפֿאַר אַרבעטן מיר בשותפֿות מיט אײַך." },
  "Executive Director & Partner": { es: "Director Ejecutivo y Socio", fr: "Directeur exécutif et associé", de: "Geschäftsführender Direktor & Partner", ru: "Исполнительный директор и партнёр", nl: "Uitvoerend Directeur & Partner", he: "מנהל בכיר ושותף", yi: "עקזעקוטיווער דירעקטאָר און שותף" },
  "Partner & Chief Operating Officer": { es: "Socio y Director de Operaciones", fr: "Associé et Directeur des opérations", de: "Partner & Chief Operating Officer", ru: "Партнёр и операционный директор", nl: "Partner & Chief Operating Officer", he: "שותף ומנהל תפעול ראשי", yi: "שותּף און הויפּט־אָפּעראַציע־פֿירער" },
  "First name": { es: "Nombre", fr: "Prénom", de: "Vorname", ru: "Имя", nl: "Voornaam", he: "שם פרטי", yi: "פֿאָרנאָמען" },
  "Founder & CEO": { es: "Fundador y CEO", fr: "Fondateur et CEO", de: "Gründer & CEO", ru: "Основатель и генеральный директор", nl: "Oprichter & CEO", he: "מייסד ומנכ\"ל", yi: "גרינדער און הויפּט־דירעקטאָר" },
  "Founders and advisors at the same table.": { es: "Fundadores y asesores en la misma mesa.", fr: "Fondateurs et conseillers autour de la même table.", de: "Gründer und Berater am selben Tisch.", ru: "Основатели и советники за одним столом.", nl: "Oprichters en adviseurs aan dezelfde tafel.", he: "מייסדים ויועצים סביב אותו שולחן.", yi: "גרינדער און יועצים בײַם זעלבן טיש." },
  "Four areas. Apply to any.": { es: "Cuatro áreas. Postúlate a la que quieras.", fr: "Quatre domaines. Candidatez à celui de votre choix.", de: "Vier Bereiche. Bewerbung in jedem möglich.", ru: "Четыре направления. Откликайтесь на любое.", nl: "Vier domeinen. Solliciteer voor elk ervan.", he: "ארבעה תחומים. אפשר להגיש לכל אחד מהם.", yi: "פֿיר געביטן. מעלדט זיך אָן פֿאַר וועלכן עס איז." },
  "Free 20-minute call": { es: "Llamada gratuita de 20 minutos", fr: "Entretien gratuit de 20 minutes", de: "Kostenloses 20-Minuten-Gespräch", ru: "Бесплатный 20-минутный звонок", nl: "Gratis gesprek van 20 minuten", he: "שיחת 20 דקות ללא עלות", yi: "אומזיסטער 20־מינוטיקער שמועס" },
  "Full-time and select part-time. Remote, hybrid, or on-site.": { es: "Jornada completa y algunos puestos a tiempo parcial. En remoto, híbrido o presencial.", fr: "Temps plein et, sur sélection, temps partiel. À distance, en hybride ou sur site.", de: "Vollzeit und ausgewählte Teilzeitstellen. Remote, hybrid oder vor Ort.", ru: "Полная занятость и отдельные позиции с частичной. Удалённо, гибридно или в офисе.", nl: "Voltijds en geselecteerde deeltijdse functies. Op afstand, hybride of op kantoor.", he: "משרה מלאה ומשרות חלקיות נבחרות. מרחוק, היברידי או במשרד.", yi: "פֿול־צײַטיקע און אויסגעקליבענע האַלב־צײַטיקע. פֿון דער ווײַטנס, היבריד, אָדער אויפֿן אָרט." },
  "Fully insured": { es: "Totalmente asegurado", fr: "Entièrement assuré", de: "Vollständig versichert", ru: "Полное страхование", nl: "Volledig verzekerd", he: "מבוטח במלואו", yi: "אין גאַנצן פֿאַרזיכערט" },
  "Get paired today with an ELSIAA AI specialist to discuss your business.": { es: "Conecta hoy mismo con un especialista en IA de ELSIAA para hablar de tu negocio.", fr: "Échangez dès aujourd'hui avec un spécialiste IA d'ELSIAA au sujet de votre entreprise.", de: "Sprechen Sie noch heute mit einem KI-Spezialisten von ELSIAA über Ihr Unternehmen.", ru: "Уже сегодня мы подберём вам ИИ-специалиста ELSIAA для обсуждения вашего бизнеса.", nl: "Word vandaag nog gekoppeld aan een ELSIAA AI-specialist om uw bedrijf te bespreken.", he: "קבלו עוד היום התאמה למומחה AI מ־ELSIAA לשיחה על העסק שלכם.", yi: "ווערט הײַנט צוגעפּאָרט מיט אַן ELSIAA ספּעציאַליסט פֿאַר קינסטלעכער אינטעליגענץ צו באַרעדן אײַער געשעפֿט." },
  "Go deeper": { es: "Profundiza", fr: "Aller plus loin", de: "Tiefer einsteigen", ru: "Углубитесь в детали", nl: "Ga dieper", he: "מעמיקים", yi: "גייט טיפֿער" },
  "HIPAA & compliance ready": { es: "Listo para HIPAA y cumplimiento normativo", fr: "Prêt pour HIPAA et la conformité", de: "Bereit für HIPAA & Compliance", ru: "Соответствие HIPAA и нормативным требованиям", nl: "Klaar voor HIPAA & compliance", he: "מוכן ל־HIPAA ולדרישות רגולציה", yi: "גרייט פֿאַר HIPAA און רעגולירונג־אָנהאַלטונג" },
  "Hardened against hacks": { es: "Blindado contra ataques", fr: "Renforcé contre les intrusions", de: "Gehärtet gegen Angriffe", ru: "Устойчивость к взлому", nl: "Bestand tegen hacks", he: "מחוסן מפני פריצות", yi: "פֿאַרהאַרטעוועט קעגן האַקער־אַטאַקעס" },
  "Hardened, tested, fully insured. No pilots.": { es: "Blindado, probado y totalmente asegurado. Sin pilotos.", fr: "Renforcé, testé, entièrement assuré. Aucun projet pilote.", de: "Gehärtet, getestet, vollständig versichert. Keine Pilotprojekte.", ru: "Защищено, протестировано, полностью застраховано. Никаких пилотных проектов.", nl: "Gehard, getest, volledig verzekerd. Geen pilootprojecten.", he: "מחוסן, נבדק, מבוטח במלואו. בלי פיילוטים.", yi: "פֿאַרהאַרטעוועט, אויסגעפּרוּווט, אין גאַנצן פֿאַרזיכערט. קיין פּראָבע־פּראָיעקטן נישט." },
  "Have a project": { es: "¿Tienes un proyecto?", fr: "Vous avez un projet", de: "Sie haben ein Projekt", ru: "Есть проект", nl: "Heeft u een project", he: "יש לכם פרויקט", yi: "האָט איר אַ פּראָיעקט" },
  "Healthcare Advisor": { es: "Asesor de Salud", fr: "Conseiller santé", de: "Berater Gesundheitswesen", ru: "Советник по здравоохранению", nl: "Adviseur Gezondheidszorg", he: "יועץ בתחום הבריאות", yi: "יועץ פֿאַר געזונט־וועזן" },
  "I know my business best.\"": { es: "Yo conozco mi negocio mejor que nadie.\"", fr: "Je connais mon entreprise mieux que quiconque.\"", de: "Ich kenne mein Unternehmen am besten.\"", ru: "Я знаю свой бизнес лучше всех.\"", nl: "Ik ken mijn bedrijf het best.\"", he: "אני מכיר את העסק שלי הכי טוב.\"", yi: "איך קען מײַן געשעפֿט אַם בעסטן.\"" },
  "In 250–400 words, why you want to join ELSIAA and the specific contribution you'd make.": { es: "En 250–400 palabras, por qué quieres unirte a ELSIAA y qué aportarías en concreto.", fr: "En 250 à 400 mots, expliquez pourquoi vous souhaitez rejoindre ELSIAA et la contribution précise que vous apporteriez.", de: "In 250–400 Wörtern: warum Sie zu ELSIAA kommen möchten und welchen konkreten Beitrag Sie leisten würden.", ru: "В 250–400 словах опишите, почему вы хотите присоединиться к ELSIAA и какой конкретный вклад вы внесёте.", nl: "Vertel in 250–400 woorden waarom u bij ELSIAA wilt komen werken en welke concrete bijdrage u zou leveren.", he: "ב־250–400 מילים: למה אתם רוצים להצטרף ל־ELSIAA ומהי התרומה הספציפית שתביאו.", yi: "אין 250–400 ווערטער: פֿאַר וואָס איר ווילט זיך אָנשליסן צו ELSIAA און וואָס פֿאַר אַ קאָנקרעטן בײַטראָג איר וואָלט געמאַכט." },
  "Insured builds": { es: "Desarrollos asegurados", fr: "Réalisations assurées", de: "Versicherte Projekte", ru: "Застрахованных проектов", nl: "Verzekerde projecten", he: "פיתוחים מבוטחים", yi: "פֿאַרזיכערטע בויונגען" },
  "Jerusalem / Tel Aviv": { es: "Jerusalén / Tel Aviv", fr: "Jérusalem / Tel-Aviv", ru: "Иерусалим / Тель-Авив", nl: "Jeruzalem / Tel Aviv", he: "ירושלים / תל אביב", yi: "ירושלים / תל־אָבֿיבֿ" },
  "Last name": { es: "Apellidos", fr: "Nom", de: "Nachname", ru: "Фамилия", nl: "Familienaam", he: "שם משפחה", yi: "פֿאַמיליע" },
  "Leaders & advisors": { es: "Líderes y asesores", fr: "Dirigeants et conseillers", de: "Führungskräfte & Berater", ru: "Руководителей и советников", nl: "Leiders & adviseurs", he: "מנהלים ויועצים", yi: "פֿירער און יועצים" },
  "Leadership of consequence.": { es: "Liderazgo de peso.", fr: "Une direction d'envergure.", de: "Führung mit Substanz.", ru: "Руководство, с которым считаются.", nl: "Leiderschap dat telt.", he: "הנהלה בעלת משקל.", yi: "אַ פֿירערשאַפֿט מיט געוויכט." },
  "Legal & Ops": { es: "Legal y Operaciones", fr: "Juridique et opérations", de: "Recht & Operations", ru: "Юриспруденция и операции", nl: "Juridisch & Operations", he: "משפטי ותפעול", yi: "יורידיש און אָפּעראַציעס" },
  "Let's talk.": { es: "Hablemos.", fr: "Parlons-en.", de: "Sprechen wir.", ru: "Давайте обсудим.", nl: "Laten we praten.", he: "בואו נדבר.", yi: "לאָמיר רעדן." },
  "Live client systems, not internal experiments.": { es: "Sistemas en producción para clientes, no experimentos internos.", fr: "Des systèmes clients en production, pas des expérimentations internes.", de: "Live-Systeme für Kunden, keine internen Experimente.", ru: "Действующие клиентские системы, а не внутренние эксперименты.", nl: "Live klantsystemen, geen interne experimenten.", he: "מערכות חיות אצל לקוחות, לא ניסויים פנימיים.", yi: "לעבעדיקע קונה־סיסטעמען, נישט אינערלעכע עקספּערימענטן." },
  "Live in your business — and we keep it running.": { es: "En marcha en tu negocio — y nos encargamos de mantenerlo.", fr: "Déployé dans votre entreprise — et nous en assurons le fonctionnement.", de: "Live in Ihrem Unternehmen — und wir halten es am Laufen.", ru: "Запущено в вашем бизнесе — и мы поддерживаем работу.", nl: "Live in uw bedrijf — en wij houden het draaiende.", he: "עולה לאוויר בעסק שלכם — ואנחנו דואגים שימשיך לרוץ.", yi: "לעבעדיק אין אײַער געשעפֿט — און מיר האַלטן עס גייענדיק." },
  "Los Angeles": { es: "Los Ángeles", ru: "Лос-Анджелес", he: "לוס אנג'לס", yi: "לאָס אַנדזשעלעס" },
  "Meet the team →": { es: "Conoce al equipo →", fr: "Découvrir l'équipe →", de: "Team kennenlernen →", ru: "Познакомиться с командой →", nl: "Maak kennis met het team →", he: "הכירו את הצוות →", yi: "באַקענט זיך מיטן טעאַם →" },
  "Meet with us →": { es: "Reúnete con nosotros →", fr: "Nous rencontrer →", de: "Sprechen Sie mit uns →", ru: "Назначить встречу →", nl: "Maak een afspraak →", he: "קבעו איתנו פגישה →", yi: "טרעפֿט זיך מיט אונדז →" },
  "Most chosen": { es: "El más elegido", fr: "Le plus choisi", de: "Am häufigsten gewählt", ru: "Выбирают чаще всего", nl: "Meest gekozen", he: "הנבחר ביותר", yi: "אַם מערסטן אויסגעקליבן" },
  "New York · LA · London · Geneva · Antwerp · Tel Aviv.": { es: "Nueva York · LA · Londres · Ginebra · Amberes · Tel Aviv.", fr: "New York · LA · Londres · Genève · Anvers · Tel-Aviv.", de: "New York · LA · London · Genf · Antwerpen · Tel Aviv.", ru: "Нью-Йорк · Лос-Анджелес · Лондон · Женева · Антверпен · Тель-Авив.", nl: "New York · LA · Londen · Genève · Antwerpen · Tel Aviv.", he: "ניו יורק · לוס אנג'לס · לונדון · ז'נבה · אנטוורפן · תל אביב.", yi: "ניו־יאָרק · לאָס אַנדזשעלעס · לאָנדאָן · זשענעווע · אַנטווערפּן · תל־אָבֿיבֿ." },
  "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv": { es: "Nueva York · Los Ángeles · Londres · Ginebra · Amberes · Tel Aviv", fr: "New York · Los Angeles · Londres · Genève · Anvers · Tel-Aviv", de: "New York · Los Angeles · London · Genf · Antwerpen · Tel Aviv", ru: "Нью-Йорк · Лос-Анджелес · Лондон · Женева · Антверпен · Тель-Авив", nl: "New York · Los Angeles · Londen · Genève · Antwerpen · Tel Aviv", he: "ניו יורק · לוס אנג'לס · לונדון · ז'נבה · אנטוורפן · תל אביב", yi: "ניו־יאָרק · לאָס אַנדזשעלעס · לאָנדאָן · זשענעווע · אַנטווערפּן · תל־אָבֿיבֿ" },
  "One standard.": { es: "Un solo estándar.", fr: "Une seule exigence.", de: "Ein Standard.", ru: "Единый стандарт.", nl: "Eén standaard.", he: "סטנדרט אחד.", yi: "איין סטאַנדאַרט." },
  "Open roles": { es: "Vacantes abiertas", fr: "Postes ouverts", de: "Offene Stellen", ru: "Открытые вакансии", nl: "Open vacatures", he: "משרות פתוחות", yi: "אָפֿענע שטעלעס" },
  "Operators who have run businesses like yours.": { es: "Operadores que han dirigido negocios como el tuyo.", fr: "Des opérationnels qui ont dirigé des entreprises comme la vôtre.", de: "Praktiker, die Unternehmen wie Ihres geführt haben.", ru: "Управленцы, которые руководили бизнесом, подобным вашему.", nl: "Operationele leiders die bedrijven zoals het uwe hebben geleid.", he: "אנשי עסקים שניהלו חברות כמו שלכם.", yi: "אָפּעראַטאָרן וואָס האָבן געפֿירט געשעפֿטן ווי אײַערע." },
  "Please write in your own words.": { es: "Escribe con tus propias palabras, por favor.", fr: "Veuillez rédiger avec vos propres mots.", de: "Bitte formulieren Sie in eigenen Worten.", ru: "Пожалуйста, напишите своими словами.", nl: "Gelieve in uw eigen woorden te schrijven.", he: "נא לכתוב במילים שלכם.", yi: "שרײַבט ביטע אין אײַערע אייגענע ווערטער." },
  "Product, interface, and brand systems.": { es: "Producto, interfaz y sistemas de marca.", fr: "Produit, interface et systèmes de marque.", de: "Produkt-, Interface- und Markensysteme.", ru: "Продукт, интерфейсы и системы бренда.", nl: "Product-, interface- en merksystemen.", he: "מוצר, ממשק ומערכות מותג.", yi: "פּראָדוקט־, אינטערפֿייס־ און מאַרקע־סיסטעמען." },
  "Protected against bugs": { es: "Protegido contra errores", fr: "Protégé contre les bugs", de: "Geschützt vor Fehlern", ru: "Защита от программных ошибок", nl: "Beschermd tegen bugs", he: "מוגן מפני באגים", yi: "באַשיצט קעגן פּראָגראַם־פֿעלערן" },
  "Real impact.": { es: "Impacto real.", fr: "Un impact réel.", de: "Echte Wirkung.", ru: "Реальный результат.", nl: "Echte impact.", he: "השפעה אמיתית.", yi: "אַן אמתע ווירקונג." },
  "Request a quote": { es: "Solicita un presupuesto", fr: "Demander un devis", de: "Angebot anfordern", ru: "Запросить смету", nl: "Vraag een offerte aan", he: "בקשת הצעת מחיר", yi: "בעט אַ פּרײַז־שאַצונג" },
  "Scoped plan": { es: "Plan definido", fr: "Plan cadré", de: "Umfang und Plan", ru: "Проработанный план", nl: "Afgebakend plan", he: "תוכנית מאופיינת", yi: "אויסגעאַרבעטער פּלאַן" },
  "Scoping and relationships with growth-stage clients.": { es: "Definición de alcance y relación con clientes en fase de crecimiento.", fr: "Cadrage et relation avec des clients en phase de croissance.", de: "Scoping und Beziehungen zu Kunden in der Wachstumsphase.", ru: "Проработка задач и отношения с клиентами на стадии роста.", nl: "Scoping en relatiebeheer met klanten in groeifase.", he: "אפיון וניהול קשרים עם לקוחות בשלבי צמיחה.", yi: "אויסאַרבעטן פּראָיעקטן און פֿירן באַציִונגען מיט קונים אין וווּקס־סטאַדיע." },
  "Six cities.": { es: "Seis ciudades.", fr: "Six villes.", de: "Sechs Städte.", ru: "Шесть городов.", nl: "Zes steden.", he: "שש ערים.", yi: "זעקס שטעט." },
  "Software, AI systems, and automation infrastructure.": { es: "Software, sistemas de IA e infraestructura de automatización.", fr: "Logiciels, systèmes d'IA et infrastructures d'automatisation.", de: "Software, KI-Systeme und Automatisierungsinfrastruktur.", ru: "Программное обеспечение, ИИ-системы и инфраструктура автоматизации.", nl: "Software, AI-systemen en automatiseringsinfrastructuur.", he: "תוכנה, מערכות AI ותשתיות אוטומציה.", yi: "סאָפֿטווער, סיסטעמען פֿון קינסטלעכער אינטעליגענץ, און אויטאָמאַטיזאַציע־אינפֿראַסטרוקטור." },
  "Start here": { es: "Empieza aquí", fr: "Commencer ici", de: "Hier beginnen", ru: "Начните здесь", nl: "Begin hier", he: "מתחילים כאן", yi: "הייבט אָן דאָ" },
  "Starting at": { es: "Desde", fr: "À partir de", de: "Ab", ru: "От", nl: "Vanaf", he: "החל מ־", yi: "אָנהייבנדיק פֿון" },
  "Strategy · Technology · Growth": { es: "Estrategia · Tecnología · Crecimiento", fr: "Stratégie · Technologie · Croissance", de: "Strategie · Technologie · Wachstum", ru: "Стратегия · Технологии · Рост", nl: "Strategie · Technologie · Groei", he: "אסטרטגיה · טכנולוגיה · צמיחה", yi: "סטראַטעגיע · טעכנאָלאָגיע · וווּקס" },
  "Submit application →": { es: "Enviar solicitud →", fr: "Envoyer ma candidature →", de: "Bewerbung absenden →", ru: "Отправить заявку →", nl: "Sollicitatie versturen →", he: "שליחת מועמדות →", yi: "גיט אײַן די אַפּליקאַציע →" },
  "Tell us what you need built.": { es: "Cuéntanos qué necesitas construir.", fr: "Dites-nous ce que vous souhaitez faire construire.", de: "Sagen Sie uns, was Sie bauen lassen möchten.", ru: "Расскажите, что нужно создать.", nl: "Vertel ons wat u wilt laten bouwen.", he: "ספרו לנו מה צריך לבנות.", yi: "דערציילט אונדז וואָס איר דאַרפֿט אויפֿבויען." },
  "Tell us what you're dealing with. No pitch, no charge.": { es: "Cuéntanos a qué te enfrentas. Sin discurso de venta y sin costo.", fr: "Exposez-nous votre situation. Sans argumentaire commercial, sans frais.", de: "Sagen Sie uns, worum es geht. Kein Verkaufsgespräch, keine Kosten.", ru: "Расскажите, с чем вы столкнулись. Без презентаций и без оплаты.", nl: "Vertel ons waarmee u zit. Geen verkooppraatje, geen kosten.", he: "ספרו לנו עם מה אתם מתמודדים. בלי מכירות, בלי תשלום.", yi: "דערציילט אונדז מיט וואָס איר האָט צו טאָן. קיין פֿאַרקויף־רעדע נישט, קיין אָפּצאָל נישט." },
  "The measure of it": { es: "La medida de todo esto", fr: "L'ampleur en chiffres", de: "Woran man es misst", ru: "В цифрах", nl: "In cijfers", he: "קנה המידה", yi: "די מאָס פֿון דעם" },
  "The systems that run the business — automation, portals, integrations.": { es: "Los sistemas que hacen funcionar el negocio — automatización, portales, integraciones.", fr: "Les systèmes qui font tourner l'entreprise — automatisation, portails, intégrations.", de: "Die Systeme, die Ihr Unternehmen am Laufen halten — Automatisierung, Portale, Integrationen.", ru: "Системы, на которых работает бизнес — автоматизация, порталы, интеграции.", nl: "De systemen die uw bedrijf draaiende houden — automatisering, portalen, integraties.", he: "המערכות שמריצות את העסק — אוטומציה, פורטלים ואינטגרציות.", yi: "די סיסטעמען וואָס פֿירן דעם געשעפֿט — אויטאָמאַטיזאַציע, פּאָרטאַלן, אינטעגראַציעס." },
  "Twenty minutes to understand the problem.": { es: "Veinte minutos para entender el problema.", fr: "Vingt minutes pour comprendre le problème.", de: "Zwanzig Minuten, um das Problem zu verstehen.", ru: "Двадцать минут, чтобы разобраться в задаче.", nl: "Twintig minuten om het probleem te begrijpen.", he: "עשרים דקות להבנת הבעיה.", yi: "צוואַנציק מינוט צו פֿאַרשטיין דעם פּראָבלעם." },
  "University of Toronto": { es: "Universidad de Toronto", fr: "Université de Toronto", ru: "Университет Торонто", he: "אוניברסיטת טורונטו", yi: "אוניווערסיטעט פֿון טאָראָנטאָ" },
  "University of Toronto faculty · six cities · three continents · fully insured builds.": { es: "Profesorado de la Universidad de Toronto · seis ciudades · tres continentes · desarrollos totalmente asegurados.", fr: "Corps professoral de l'Université de Toronto · six villes · trois continents · réalisations entièrement assurées.", de: "Lehrende der University of Toronto · sechs Städte · drei Kontinente · vollständig versicherte Projekte.", ru: "Преподаватели Университета Торонто · шесть городов · три континента · полностью застрахованные проекты.", nl: "Verbonden aan de University of Toronto · zes steden · drie continenten · volledig verzekerde projecten.", he: "סגל אוניברסיטת טורונטו · שש ערים · שלוש יבשות · פיתוח מבוטח במלואו.", yi: "פֿאַקולטעט פֿון דער אוניווערסיטעט פֿון טאָראָנטאָ · זעקס שטעט · דרײַ קאָנטינענטן · אין גאַנצן פֿאַרזיכערטע בויונגען." },
  "Visits by appointment · virtual support 24/7 · every engagement fully insured": { es: "Visitas con cita previa · soporte virtual 24/7 · cada proyecto totalmente asegurado", fr: "Visites sur rendez-vous · assistance à distance 24/7 · chaque mission entièrement assurée", de: "Besuche nach Vereinbarung · virtueller Support 24/7 · jedes Projekt vollständig versichert", ru: "Приём по записи · онлайн-поддержка 24/7 · каждый проект полностью застрахован", nl: "Bezoek op afspraak · virtuele ondersteuning 24/7 · elke opdracht volledig verzekerd", he: "פגישות בתיאום מראש · תמיכה מרחוק 24/7 · כל התקשרות מבוטחת במלואה", yi: "באַזוכן לויט אַ באַשטעלטער צײַט · ווירטועלע שטיצע 24/7 · יעדער פּראָיעקט אין גאַנצן פֿאַרזיכערט" },
  "We help businesses with every aspect of their tech — and anything related to it.": { es: "Ayudamos a las empresas en todos los aspectos de su tecnología — y en todo lo relacionado con ella.", fr: "Nous accompagnons les entreprises sur tous les aspects de leur technologie — et sur tout ce qui s'y rattache.", de: "Wir unterstützen Unternehmen in allen Technologiefragen — und in allem, was damit zusammenhängt.", ru: "Мы помогаем бизнесу во всех технологических вопросах — и во всём, что с ними связано.", nl: "Wij helpen bedrijven met elk aspect van hun technologie — en met alles wat daarmee samenhangt.", he: "אנחנו מלווים עסקים בכל היבט טכנולוגי — ובכל מה שקשור אליו.", yi: "מיר העלפֿן געשעפֿטן מיט יעדן אַספּעקט פֿון זייער טעכנאָלאָגיע — און מיט אַלץ וואָס הענגט דערמיט צוזאַם." },
  "We only ship work we'd put our name on. If that's how you work, we want to meet you.": { es: "Solo entregamos trabajo que firmaríamos con nuestro nombre. Si así es como trabajas tú, queremos conocerte.", fr: "Nous ne livrons que des travaux que nous sommes prêts à signer. Si c'est ainsi que vous travaillez, nous voulons vous rencontrer.", de: "Wir liefern nur Arbeit aus, für die wir mit unserem Namen einstehen. Wenn Sie so arbeiten, möchten wir Sie kennenlernen.", ru: "Мы выпускаем только ту работу, под которой готовы поставить своё имя. Если вы работаете так же — мы хотим с вами познакомиться.", nl: "Wij leveren alleen werk waar wij onze naam onder zetten. Werkt u zo, dan ontmoeten wij u graag.", he: "אנחנו מוציאים לאוויר רק עבודה שנחתום עליה בשמנו. אם ככה אתם עובדים, נשמח להכיר.", yi: "מיר לאָזן נאָר אַרויס אַרבעט וואָס מיר וואָלטן אונטערגעשריבן מיט אונדזער נאָמען. אויב אַזוי אַרבעט איר אויך, ווילן מיר זיך מיט אײַך באַקענען." },
  "We upgrade your business daily.": { es: "Mejoramos tu negocio cada día.", fr: "Nous faisons progresser votre entreprise, jour après jour.", de: "Wir machen Ihr Unternehmen jeden Tag besser.", ru: "Мы улучшаем ваш бизнес каждый день.", nl: "Wij maken uw bedrijf elke dag beter.", he: "אנחנו משדרגים את העסק שלכם מדי יום.", yi: "מיר פֿאַרבעסערן אײַער געשעפֿט טאָג־טעגלעך." },
  "Websites from $750 · Apps from $10k · Backend software from $1,000.": { es: "Sitios web desde $750 · Apps desde $10k · Software backend desde $1,000.", fr: "Sites web à partir de $750 · Applications à partir de $10k · Logiciels backend à partir de $1,000.", de: "Websites ab $750 · Apps ab $10k · Backend-Software ab $1,000.", ru: "Сайты от $750 · Приложения от $10k · Серверное ПО от $1,000.", nl: "Websites vanaf $750 · Apps vanaf $10k · Backendsoftware vanaf $1,000.", he: "אתרים מ־$750 · אפליקציות מ־$10k · מערכות בקאנד מ־$1,000.", yi: "וועבזײַטן פֿון $750 · אַפּליקאַציעס פֿון $10k · באַקענד־סאָפֿטווער פֿון $1,000." },
  "Websites, apps, automation, backend. A clear plan and price within 3 days.": { es: "Sitios web, apps, automatización, backend. Un plan y un precio claros en 3 días.", fr: "Sites web, applications, automatisation, backend. Un plan et un prix clairs sous 3 jours.", de: "Websites, Apps, Automatisierung, Backend. Ein klarer Plan und Preis innerhalb von 3 Tagen.", ru: "Сайты, приложения, автоматизация, серверная часть. Чёткий план и цена в течение 3 дней.", nl: "Websites, apps, automatisering, backend. Een duidelijk plan en prijs binnen 3 dagen.", he: "אתרים, אפליקציות, אוטומציה ובקאנד. תוכנית ומחיר ברורים תוך 3 ימים.", yi: "וועבזײַטן, אַפּליקאַציעס, אויטאָמאַטיזאַציע, באַקענד. אַ קלאָרער פּלאַן און פּרײַז אין 3 טעג אַרום." },
  "What ELSIAA adds": { es: "Lo que aporta ELSIAA", fr: "Ce qu'ELSIAA apporte", de: "Was ELSIAA beiträgt", ru: "Что добавляет ELSIAA", nl: "Wat ELSIAA toevoegt", he: "מה ELSIAA מוסיפה", yi: "וואָס ELSIAA לייגט צו" },
  "What happens next.": { es: "Qué sucede después.", fr: "La suite du processus.", de: "Wie es weitergeht.", ru: "Что будет дальше.", nl: "Wat er nu volgt.", he: "מה קורה הלאה.", yi: "וואָס קומט ווײַטער." },
  "Who we are": { es: "Quiénes somos", fr: "Qui nous sommes", de: "Wer wir sind", ru: "Кто мы", nl: "Wie wij zijn", he: "מי אנחנו", yi: "ווער מיר זײַנען" },
  "With God's help we shall do and succeed.": { es: "Con la ayuda de Dios, haremos y prosperaremos.", fr: "Avec l'aide de Dieu, nous ferons et nous réussirons.", de: "Mit Gottes Hilfe werden wir handeln und Erfolg haben.", ru: "С Божьей помощью мы сделаем и преуспеем.", nl: "Met Gods hulp zullen wij handelen en slagen.", he: "בעזרת השם נעשה ונצליח.", yi: "מיט גאָטס הילף וועלן מיר טאָן און מצליח זײַן." },
  "Work arrangement": { es: "Modalidad de trabajo", fr: "Mode de travail", de: "Arbeitsmodell", ru: "Формат работы", nl: "Werkregeling", he: "מתכונת עבודה", yi: "אַרבעט־אָרדענונג" },
  "Written by you, not by AI — machine-written answers are detected and disqualified.": { es: "Escrito por ti, no por IA — las respuestas generadas por máquina se detectan y quedan descalificadas.", fr: "Rédigé par vous, non par une IA — les réponses générées par une machine sont détectées et éliminées.", de: "Von Ihnen verfasst, nicht von einer KI — maschinell geschriebene Antworten werden erkannt und führen zum Ausschluss.", ru: "Написано вами, а не ИИ — машинно-сгенерированные ответы выявляются и отклоняются.", nl: "Door u geschreven, niet door AI — machinaal geschreven antwoorden worden gedetecteerd en gediskwalificeerd.", he: "בכתב ידכם, לא בעזרת AI — תשובות שנכתבו במכונה מזוהות ונפסלות.", yi: "אָנגעשריבן פֿון אײַך, נישט פֿון קינסטלעכער אינטעליגענץ — מאַשין־געשריבענע ענטפֿערס ווערן דערקענט און דיסקוואַליפֿיצירט." },
  "Your data stays yours": { es: "Tus datos siguen siendo tuyos", fr: "Vos données restent les vôtres", de: "Ihre Daten bleiben Ihre", ru: "Ваши данные остаются вашими", nl: "Uw data blijft van u", he: "המידע שלכם נשאר שלכם", yi: "אײַערע דאַטן בלײַבן אײַערע" },

  // ---- stragglers ----
  "Language": { es: "Idioma", fr: "Langue", de: "Sprache", ru: "Язык", nl: "Taal", he: "שפה", yi: "שפּראַך" },
  "Three ways to start. Pick whichever fits — the first twenty minutes are always free.": { es: "Tres formas de empezar. Elige la que encaje — los primeros veinte minutos siempre son gratis.", fr: "Trois façons de commencer. Choisissez celle qui convient — les vingt premières minutes sont toujours gratuites.", de: "Drei Wege zu starten. Wählen Sie den passenden — die ersten zwanzig Minuten sind immer kostenlos.", ru: "Три способа начать. Выберите подходящий — первые двадцать минут всегда бесплатны.", nl: "Drie manieren om te beginnen. Kies wat past — de eerste twintig minuten zijn altijd gratis.", he: "שלוש דרכים להתחיל. בחרו את המתאימה — עשרים הדקות הראשונות תמיד חינם.", yi: "דרײַ וועגן אָנצוהייבן. קלײַבט אויס וואָס פּאַסט — די ערשטע צוואַנציק מינוט זײַנען שטענדיק פֿרײַ." },
  "Free": { es: "Gratis", fr: "Gratuit", de: "Kostenlos", ru: "Бесплатно", nl: "Gratis", he: "חינם", yi: "פֿרײַ" },
  "1-hour consult": { es: "Consulta de 1 hora", fr: "Consultation d'1 heure", de: "1-Stunden-Beratung", ru: "Консультация 1 час", nl: "Consult van 1 uur", he: "ייעוץ של שעה", yi: "קאָנסולטאַציע פֿון אַ שעה" },
  "Scoped": { es: "Presupuestado", fr: "Cadré", de: "Definiert", ru: "С оценкой", nl: "Afgebakend", he: "מוגדר", yi: "באַגרענעצט" },
  "We talk": { es: "Hablamos", fr: "Nous parlons", de: "Wir sprechen", ru: "Мы говорим", nl: "We praten", he: "מדברים", yi: "מיר רעדן" },
  "We build": { es: "Construimos", fr: "Nous construisons", de: "Wir bauen", ru: "Мы строим", nl: "We bouwen", he: "בונים", yi: "מיר בויען" },
  "It ships": { es: "Se lanza", fr: "Mise en ligne", de: "Es geht live", ru: "Запускаем", nl: "Het gaat live", he: "עולה לאוויר", yi: "עס גייט אַרויס" },
  "Design, automation, software, and consultation — four divisions, one standard.": { es: "Diseño, automatización, software y consultoría — cuatro divisiones, un solo estándar.", fr: "Design, automatisation, logiciel et conseil — quatre divisions, un seul standard.", de: "Design, Automatisierung, Software und Beratung — vier Bereiche, ein Standard.", ru: "Дизайн, автоматизация, ПО и консалтинг — четыре направления, один стандарт.", nl: "Ontwerp, automatisering, software en advies — vier divisies, één standaard.", he: "עיצוב, אוטומציה, תוכנה וייעוץ — ארבעה תחומים, סטנדרט אחד.", yi: "דיזײַן, אויטאָמאַטיזאַציע, ווײַכווארג און קאָנסולטאַציע — פֿיר אָפּטיילן, איין סטאַנדאַרט." },
  "Work": { es: "Trabajo", fr: "Travaux", de: "Arbeiten", ru: "Работы", nl: "Werk", he: "עבודה", yi: "אַרבעט" },
  "The Store": { es: "La tienda", fr: "La boutique", de: "Der Shop", ru: "Магазин", nl: "De winkel", he: "החנות", yi: "דער קלייט" },
  "Company": { es: "Empresa", fr: "Entreprise", de: "Unternehmen", ru: "Компания", nl: "Bedrijf", he: "החברה", yi: "פֿירמע" },
  "Privacy": { es: "Privacidad", fr: "Confidentialité", de: "Datenschutz", ru: "Конфиденциальность", nl: "Privacy", he: "פרטיות", yi: "פּריוואַטקייט" },
  "Terms": { es: "Términos", fr: "Conditions", de: "Bedingungen", ru: "Условия", nl: "Voorwaarden", he: "תנאים", yi: "תּנאָים" },
  "24/7 Support": { es: "Soporte 24/7", fr: "Assistance 24/7", de: "24/7-Support", ru: "Поддержка 24/7", nl: "24/7 support", he: "תמיכה 24/7", yi: "שטיצע 24/7" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: "en", setLang: () => {} });
export const useLang = () => useContext(LangCtx);

function translateDom(lang: Lang) {
  if (typeof document === "undefined") return;
  const root = document.body;
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = (node as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") return NodeFilter.FILTER_REJECT;
      if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let n = walker.nextNode();
  while (n) {
    nodes.push(n as Text);
    n = walker.nextNode();
  }
  for (const node of nodes) {
    // stash the original English once
    const el = node as Text & { __en?: string };
    if (el.__en === undefined) el.__en = node.nodeValue ?? "";
    const original = el.__en;
    const key = original.trim();
    if (lang === "en") {
      if (node.nodeValue !== original) node.nodeValue = original;
      continue;
    }
    const row = DICT[key];
    const translated = row?.[lang];
    if (translated) {
      // preserve surrounding whitespace
      const lead = original.match(/^\s*/)?.[0] ?? "";
      const trail = original.match(/\s*$/)?.[0] ?? "";
      const next = lead + translated + trail;
      if (node.nodeValue !== next) node.nodeValue = next;
    } else if (node.nodeValue !== original) {
      node.nodeValue = original;
    }
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const timers = useRef<number[]>([]);

  const apply = useCallback((l: Lang) => {
    const html = document.documentElement;
    html.lang = l;
    html.dir = RTL.includes(l) ? "rtl" : "ltr";
    translateDom(l);
    // late re-passes catch content that renders/animates in after the switch
    timers.current.forEach(clearTimeout);
    timers.current = [300, 900, 1800].map((ms) => window.setTimeout(() => translateDom(l), ms));
  }, []);

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      try {
        localStorage.setItem("elsiaa_lang", l);
      } catch {
        /* noop */
      }
      apply(l);
    },
    [apply],
  );

  // restore saved language on mount
  useEffect(() => {
    let saved: Lang | null = null;
    try {
      saved = localStorage.getItem("elsiaa_lang") as Lang | null;
    } catch {
      /* noop */
    }
    if (saved && LANGS.some((x) => x.code === saved) && saved !== "en") {
      setLangState(saved);
      apply(saved);
    }
  }, [apply]);

  // re-translate on client-side route changes (history navigation)
  useEffect(() => {
    if (lang === "en") return;
    const onNav = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [80, 400, 1000].map((ms) => window.setTimeout(() => translateDom(lang), ms));
    };
    window.addEventListener("popstate", onNav);
    const origPush = history.pushState;
    history.pushState = function (...args) {
      const r = origPush.apply(this, args as Parameters<typeof history.pushState>);
      onNav();
      return r;
    };
    return () => {
      window.removeEventListener("popstate", onNav);
      history.pushState = origPush;
    };
  }, [lang]);

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
