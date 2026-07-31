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
