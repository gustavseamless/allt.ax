/**
 * Seed data for allt.ax – ALL businesses are fictional demonstration data
 * (marked with demo: true). No real companies are represented as paying or
 * sponsored customers.
 */
import { PrismaClient, Role, CampaignStatus, CampaignType, ClaimStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const now = new Date();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86_400_000);

// --- Opening hour presets ----------------------------------------------------
const H = {
  office: { mon: [["09:00", "17:00"]], tue: [["09:00", "17:00"]], wed: [["09:00", "17:00"]], thu: [["09:00", "17:00"]], fri: [["09:00", "16:00"]], sat: [], sun: [] },
  shop: { mon: [["10:00", "18:00"]], tue: [["10:00", "18:00"]], wed: [["10:00", "18:00"]], thu: [["10:00", "18:00"]], fri: [["10:00", "18:00"]], sat: [["10:00", "15:00"]], sun: [] },
  restaurant: { mon: [["11:00", "22:00"]], tue: [["11:00", "22:00"]], wed: [["11:00", "22:00"]], thu: [["11:00", "22:00"]], fri: [["11:00", "23:00"]], sat: [["12:00", "23:00"]], sun: [["12:00", "21:00"]] },
  cafe: { mon: [["08:00", "17:00"]], tue: [["08:00", "17:00"]], wed: [["08:00", "17:00"]], thu: [["08:00", "17:00"]], fri: [["08:00", "18:00"]], sat: [["09:00", "16:00"]], sun: [["10:00", "15:00"]] },
  workshop: { mon: [["07:30", "16:30"]], tue: [["07:30", "16:30"]], wed: [["07:30", "16:30"]], thu: [["07:30", "16:30"]], fri: [["07:30", "15:00"]], sat: [], sun: [] },
  salon: { mon: [], tue: [["09:00", "17:00"]], wed: [["09:00", "17:00"]], thu: [["09:00", "19:00"]], fri: [["09:00", "17:00"]], sat: [["09:00", "14:00"]], sun: [] },
  hotel: { mon: [["00:00", "23:59"]], tue: [["00:00", "23:59"]], wed: [["00:00", "23:59"]], thu: [["00:00", "23:59"]], fri: [["00:00", "23:59"]], sat: [["00:00", "23:59"]], sun: [["00:00", "23:59"]] },
  grocery: { mon: [["08:00", "20:00"]], tue: [["08:00", "20:00"]], wed: [["08:00", "20:00"]], thu: [["08:00", "20:00"]], fri: [["08:00", "20:00"]], sat: [["09:00", "18:00"]], sun: [["11:00", "16:00"]] },
  none: {},
};

// --- Municipalities -----------------------------------------------------------
const MUNICIPALITIES = [
  { name: "Mariehamn", slug: "mariehamn", lat: 60.0971, lng: 19.9348, description: "Ålands huvudstad och enda stad – här hittar du det största utbudet av restauranger, butiker och tjänster." },
  { name: "Jomala", slug: "jomala", lat: 60.1541, lng: 19.942, description: "Ålands folkrikaste landskommun, strax norr om Mariehamn, med ett växande företagsliv." },
  { name: "Finström", slug: "finstrom", lat: 60.2286,
lng: 19.9906, description: "Centralort Godby – handel och service mitt på fasta Åland." },
  { name: "Lemland", slug: "lemland", lat: 60.0782, lng: 20.1075, description: "Kommun sydost om Mariehamn med skärgårdsnära småföretag." },
  { name: "Saltvik", slug: "saltvik", lat: 60.283, lng: 20.064, description: "Anrik kommun i norra Åland, känd för vikingamarknaden." },
  { name: "Eckerö", slug: "eckero", lat: 60.222, lng: 19.554, description: "Ålands västligaste kommun med färjeförbindelse till Sverige." },
  { name: "Sund", slug: "sund", lat: 60.258, lng: 20.115, description: "Hem till Kastelholms slott och ett aktivt besöksnäringsliv." },
  { name: "Hammarland", slug: "hammarland", lat: 60.213, lng: 19.744, description: "Landsbygdskommun på västra fasta Åland." },
  { name: "Lumparland", slug: "lumparland", lat: 60.116, lng: 20.258, description: "Liten kommun med färjfäste mot skärgården." },
  { name: "Geta", slug: "geta", lat: 60.379, lng: 19.844, description: "Nordligaste kommunen på fasta Åland med dramatisk natur." },
  { name: "Vårdö", slug: "vardo", lat: 60.241, lng: 20.362, description: "Skärgårdskommun med vajerfärja från fasta Åland." },
  { name: "Kumlinge", slug: "kumlinge", lat: 60.26, lng: 20.783, description: "Skärgårdskommun mitt i Ålands östra skärgård." },
  { name: "Kökar", slug: "kokar", lat: 59.921, lng: 20.911, description: "Ålands sydligaste skärgårdskommun." },
  { name: "Brändö", slug: "brando", lat: 60.409, lng: 21.045, description: "Nordöstlig skärgårdskommun med förbindelse mot Åboland." },
  { name: "Sottunga", slug: "sottunga", lat: 60.131, lng: 20.665, description: "Finlands minsta kommun, mitt i skärgårdshavet." },
  { name: "Föglö", slug: "foglo", lat: 60.031, lng: 20.388, description: "Skärgårdskommun med livskraftig service i Degerby." },
] as const;

// --- Categories -----------------------------------------------------------------
const CATEGORIES = [
  { name: "Restauranger", slug: "restauranger", icon: "🍽️", description: "Restauranger och matställen på Åland – från vardagslunch till finmiddag." },
  { name: "Caféer", slug: "cafeer", icon: "☕", description: "Caféer och konditorier för fika, kaffe och bakverk." },
  { name: "Barer", slug: "barer", icon: "🍺", description: "Barer och pubar." },
  { name: "Hotell och boende", slug: "hotell-och-boende", icon: "🛏️", description: "Hotell, gästhem, stugor och annat boende." },
  { name: "Bygg och renovering", slug: "bygg-och-renovering", icon: "🔨", description: "Byggfirmor, snickare och renoveringstjänster." },
  { name: "Elektriker", slug: "elektriker", icon: "⚡", description: "Elinstallationer, eljour, solceller och laddboxar." },
  { name: "VVS", slug: "vvs", icon: "🔧", description: "Rörmokare, värme, vatten och sanitet." },
  { name: "Måleri", slug: "maleri", icon: "🎨", description: "Målare och tapetserare." },
  { name: "Städning", slug: "stadning", icon: "🧹", description: "Städfirmor för hem och företag." },
  { name: "Fastighetsskötsel", slug: "fastighetsskotsel", icon: "🏠", description: "Fastighetsservice, trädgård och snöröjning." },
  { name: "Bilverkstäder", slug: "bilverkstader", icon: "🚗", description: "Bilverkstäder och fordonsservice." },
  { name: "Bilförsäljning", slug: "bilforsaljning", icon: "🚙", description: "Nya och begagnade bilar." },
  { name: "Däck och bilservice", slug: "dack-och-bilservice", icon: "🛞", description: "Däckbyten, hjulskiften och service." },
  { name: "Frisörer", slug: "frisorer", icon: "💇", description: "Frisörsalonger och barberare." },
  { name: "Skönhet och hälsa", slug: "skonhet-och-halsa", icon: "💆", description: "Massage, hudvård och friskvård." },
  { name: "Träning", slug: "traning", icon: "🏋️", description: "Gym, träningscenter och idrott." },
  { name: "Juridik", slug: "juridik", icon: "⚖️", description: "Advokater och juridiska tjänster." },
  { name: "Redovisning", slug: "redovisning", icon: "📊", description: "Bokföring, bokslut och ekonomitjänster." },
  { name: "Banker och finans", slug: "banker-och-finans", icon: "🏦", description: "Banker och finansiella tjänster." },
  { name: "Försäkring", slug: "forsakring", icon: "🛡️", description: "Försäkringsbolag och ombud." },
  { name: "Butiker", slug: "butiker", icon: "🛍️", description: "Butiker och detaljhandel." },
  { name: "Kläder", slug: "klader", icon: "👕", description: "Klädbutiker och mode." },
  { name: "Livsmedel", slug: "livsmedel", icon: "🛒", description: "Matbutiker och livsmedel." },
  { name: "Båtar och marina tjänster", slug: "batar-och-marina-tjanster", icon: "⛵", description: "Båtservice, marinor och sjöliv." },
  { name: "Gästhamnar", slug: "gasthamnar", icon: "⚓", description: "Gästhamnar för besökande båtar." },
  { name: "Transport", slug: "transport", icon: "🚚", description: "Transport- och logistikföretag." },
  { name: "Taxi", slug: "taxi", icon: "🚕", description: "Taxi och persontransport." },
  { name: "IT och teknik", slug: "it-och-teknik", icon: "💻", description: "IT-tjänster, webbutveckling och support." },
  { name: "Marknadsföring", slug: "marknadsforing", icon: "📣", description: "Reklam, kommunikation och marknadsföring." },
  { name: "Foto och video", slug: "foto-och-video", icon: "📷", description: "Fotografer och videoproduktion." },
  { name: "Underhållning", slug: "underhallning", icon: "🎭", description: "Nöjen, upplevelser och aktiviteter." },
  { name: "Evenemangstjänster", slug: "evenemangstjanster", icon: "🎪", description: "Tjänster för fester och evenemang." },
  { name: "Barn och familj", slug: "barn-och-familj", icon: "👨‍👩‍👧", description: "Aktiviteter och tjänster för barnfamiljer." },
  { name: "Vård", slug: "vard", icon: "🩺", description: "Hälso- och sjukvårdstjänster." },
  { name: "Utbildning", slug: "utbildning", icon: "🎓", description: "Kurser, skolor och utbildning." },
  { name: "Föreningar", slug: "foreningar", icon: "🤝", description: "Föreningar och organisationer." },
] as const;

type Biz = {
  name: string;
  slug: string;
  category: string;
  extraCategories?: string[];
  municipality: string;
  city: string;
  address: string;
  postalCode: string;
  short: string;
  description: string;
  phone: string;
  email: string;
  website?: string;
  hours: object;
  tags?: string[];
  attributes?: object;
  verified?: boolean;
  premium?: boolean;
  latOffset?: number;
  lngOffset?: number;
  services?: { name: string; description?: string; priceText?: string }[];
  bookingUrl?: string;
};

// All businesses below are fictional demonstration data.
const BUSINESSES: Biz[] = [
  // --- Restaurants ---
  { name: "Restaurang Sjökanten", slug: "restaurang-sjokanten", category: "restauranger", municipality: "mariehamn", city: "Mariehamn", address: "Sjöpromenaden 4", postalCode: "22100", short: "Skärgårdsmat vid Västerhamn med utsikt över segelbåtarna.", description: "Restaurang Sjökanten serverar modern skärgårdsmat med lokala råvaror från Åland. Vår meny växlar med säsongen och köket är känt för sin rökta fisk och åländska svartbrödsglass. Lunch vardagar 11–14, à la carte kvällstid. Stor uteservering under sommaren.", phone: "+358 18 121001", email: "info@sjokanten.example.ax", website: "https://sjokanten.example.ax", hours: H.restaurant, tags: ["lunch", "skärgårdsmat", "uteservering", "fisk"], attributes: { koekstyp: "Skärgårdsmat", prisklass: "€€€", lunch: true, uteservering: true, barnvanlig: true, vegetariskt: true, bokning: true }, verified: true, premium: true, services: [{ name: "Dagens lunch", priceText: "13,50 €" }, { name: "Skärgårdsmeny", priceText: "58 €" }], bookingUrl: "https://sjokanten.example.ax/boka" },
  { name: "Pizzeria Milano Mariehamn", slug: "pizzeria-milano-mariehamn", category: "restauranger", municipality: "mariehamn", city: "Mariehamn", address: "Torggatan 12", postalCode: "22100", short: "Klassisk kvarterspizzeria mitt i centrum.", description: "Familjedriven pizzeria med stenugn, generösa pizzor och kebab. Avhämtning och hemkörning inom Mariehamn.", phone: "+358 18 121002", email: "hej@milano.example.ax", hours: H.restaurant, tags: ["pizza", "avhämtning", "hemkörning"], attributes: { koekstyp: "Pizza", prisklass: "€", lunch: true, barnvanlig: true }, latOffset: 0.003, lngOffset: 0.002 },
  { name: "Godby Grill & Kök", slug: "godby-grill-och-kok", category: "restauranger", municipality: "finstrom", city: "Godby", address: "Godbyvägen 8", postalCode: "22410", short: "Vardagsmat och grillklassiker i Godby centrum.", description: "Grillrestaurang med husmanskost, hamburgare och dagens lunch. Samlingspunkt i Godby sedan 1998 (fiktivt exempel).", phone: "+358 18 121003", email: "info@godbygrill.example.ax", hours: H.restaurant, tags: ["lunch", "hamburgare", "husmanskost"], attributes: { koekstyp: "Husmanskost", prisklass: "€€", lunch: true, barnvanlig: true }, verified: true },
  { name: "Värdshuset Degerby", slug: "vardshuset-degerby", category: "restauranger", extraCategories: ["hotell-och-boende"], municipality: "foglo", city: "Degerby", address: "Hamnvägen 3", postalCode: "22710", short: "Skärgårdsvärdshus med mat och rum i Degerby, Föglö.", description: "Anrikt värdshus vid färjfästet i Degerby. Lokala fiskrätter, sommarterrass och sex gästrum. Perfekt stopp på skärgårdsturen.", phone: "+358 18 121004", email: "boka@degerby.example.ax", hours: H.restaurant, tags: ["skärgård", "boende", "fisk", "uteservering"], attributes: { koekstyp: "Skärgårdsmat", prisklass: "€€", uteservering: true, bokning: true }, verified: true },

  // --- Cafés ---
  { name: "Café Sjöblomman", slug: "cafe-sjoblomman", category: "cafeer", municipality: "mariehamn", city: "Mariehamn", address: "Norragatan 7", postalCode: "22100", short: "Hembakat, brunch och specialkaffe i hjärtat av Mariehamn.", description: "Mysigt café med egen rostning, hembakade bullar och glutenfria alternativ. Brunch på helger. Barnhörna och gratis wifi.", phone: "+358 18 121005", email: "hej@sjoblomman.example.ax", website: "https://sjoblomman.example.ax", hours: H.cafe, tags: ["fika", "brunch", "glutenfritt", "barnvänlig"], attributes: { prisklass: "€", barnvanlig: true, vegetariskt: true }, verified: true, premium: true, latOffset: 0.001, lngOffset: -0.002 },
  { name: "Kastelholms Slottscafé", slug: "kastelholms-slottscafe", category: "cafeer", municipality: "sund", city: "Kastelholm", address: "Slottsvägen 1", postalCode: "22520", short: "Sommarcafé intill Kastelholms slott.", description: "Säsongscafé med våfflor, glass och lätta luncher intill slottsområdet i Sund. Öppet maj–september (fiktivt exempel).", phone: "+358 18 121006", email: "info@slottscafe.example.ax", hours: H.cafe, tags: ["våfflor", "sommar", "utflykt", "barnvänlig"] },

  // --- Bars ---
  { name: "Sjömanspuben Ankaret", slug: "sjomanspuben-ankaret", category: "barer", municipality: "mariehamn", city: "Mariehamn", address: "Hamngatan 9", postalCode: "22100", short: "Klassisk hamnpub med åländska öl på fat.", description: "Pub med maritim inredning, lokala bryggeriöl, pubquiz på onsdagar och livemusik på helger.", phone: "+358 18 121007", email: "info@ankaret.example.ax", hours: { mon: [["16:00", "23:00"]], tue: [["16:00", "23:00"]], wed: [["16:00", "24:00"]], thu: [["16:00", "24:00"]], fri: [["15:00", "02:00"]], sat: [["15:00", "02:00"]], sun: [["16:00", "22:00"]] }, tags: ["pub", "livemusik", "quiz", "öppet sent"] },

  // --- Hotels ---
  { name: "Hotell Ålandsblick", slug: "hotell-alandsblick", category: "hotell-och-boende", municipality: "mariehamn", city: "Mariehamn", address: "Esplanaden 22", postalCode: "22100", short: "Modernt stadshotell med bastu och havsutsikt.", description: "Hotell med 48 rum mitt i Mariehamn. Relaxavdelning med bastu, frukostbuffé med åländska produkter och konferensrum för upp till 60 personer.", phone: "+358 18 121008", email: "reception@alandsblick.example.ax", website: "https://alandsblick.example.ax", hours: H.hotel, tags: ["hotell", "bastu", "konferens", "frukost"], attributes: { bastu: true, frukost: true, konferens: true, parkering: true }, verified: true, premium: true, services: [{ name: "Dubbelrum", priceText: "från 129 €/natt" }, { name: "Konferenspaket", priceText: "från 45 €/person" }], bookingUrl: "https://alandsblick.example.ax/boka", latOffset: -0.002, lngOffset: 0.004 },
  { name: "Eckerö Strandstugor", slug: "eckero-strandstugor", category: "hotell-och-boende", municipality: "eckero", city: "Storby", address: "Strandvägen 15", postalCode: "22270", short: "Mysiga stugor vid havet i Eckerö.", description: "Tolv fullt utrustade stugor med egen strand, bastuflotte och cykeluthyrning. Öppet året runt.", phone: "+358 18 121009", email: "bokning@strandstugor.example.ax", hours: H.none, tags: ["stugor", "bastu", "strand", "familj"], attributes: { bastu: true, strand: true }, verified: true },
  { name: "Gästhem Norrkulla", slug: "gasthem-norrkulla", category: "hotell-och-boende", municipality: "geta", city: "Geta", address: "Norrkullavägen 2", postalCode: "22340", short: "Lugnt gästhem nära Getabergen.", description: "Litet gästhem med åtta rum, självhushållskök och närhet till vandringsleder i Getabergen.", phone: "+358 18 121010", email: "info@norrkulla.example.ax", hours: H.none, tags: ["vandring", "natur", "budget"] },

  // --- Construction / trades ---
  { name: "Ålands Byggtjänst Ab", slug: "alands-byggtjanst", category: "bygg-och-renovering", municipality: "jomala", city: "Jomala", address: "Företagarvägen 5", postalCode: "22150", short: "Total- och delentreprenader, nybygge och renovering.", description: "Byggföretag med 25 anställda som utför allt från badrumsrenoveringar till nyckelfärdiga egnahemshus. Certifierade våtrumsinstallatörer.", phone: "+358 18 121011", email: "offert@byggtjanst.example.ax", website: "https://byggtjanst.example.ax", hours: H.workshop, tags: ["nybygge", "renovering", "badrum", "altan"], attributes: { privatkunder: true, foretagskunder: true }, verified: true, premium: true, services: [{ name: "Badrumsrenovering", priceText: "offert" }, { name: "Nyckelfärdigt hus", priceText: "offert" }] },
  { name: "Snickeri Ekström", slug: "snickeri-ekstrom", category: "bygg-och-renovering", municipality: "saltvik", city: "Kvarnbo", address: "Kvarnbovägen 11", postalCode: "22430", short: "Finsnickeri och måttbeställda kök.", description: "Enmansföretag specialiserat på platsbyggda kök, trappor och fönsterrenovering i äldre hus.", phone: "+358 18 121012", email: "erik@snickeriekstrom.example.ax", hours: H.workshop, tags: ["kök", "finsnickeri", "trappor"] },

  // --- Electricians ---
  { name: "El-Karlsson Ab", slug: "el-karlsson", category: "elektriker", municipality: "mariehamn", city: "Mariehamn", address: "Verkstadsgatan 3", postalCode: "22100", short: "Elinstallationer för hem och företag – jour dygnet runt.", description: "Auktoriserad elentreprenör med 12 montörer. Elinstallationer, elcentraler, belysningsplanering och eljour 24/7 i hela Åland. Installerar solceller och laddboxar med hög kundnöjdhet.", phone: "+358 18 121013", email: "jour@elkarlsson.example.ax", website: "https://elkarlsson.example.ax", hours: H.workshop, tags: ["eljour", "solceller", "laddbox", "elinstallation"], attributes: { akutservice: true, privatkunder: true, foretagskunder: true, solceller: true, laddboxar: true, serviceomrade: "Hela Åland" }, verified: true, premium: true, services: [{ name: "Eljour", priceText: "från 95 €/h" }, { name: "Laddboxinstallation", priceText: "från 590 €" }, { name: "Solcellspaket", priceText: "offert" }], latOffset: 0.004, lngOffset: -0.003 },
  { name: "Godby El & Automation", slug: "godby-el-automation", category: "elektriker", municipality: "finstrom", city: "Godby", address: "Industrivägen 2", postalCode: "22410", short: "Elinstallation och fastighetsautomation på norra Åland.", description: "Elfirma med fokus på smarta hem, värmestyrning och lantbruksinstallationer. Betjänar Finström, Saltvik, Sund och Geta.", phone: "+358 18 121014", email: "info@godbyel.example.ax", hours: H.workshop, tags: ["smart hem", "elinstallation", "automation"], attributes: { privatkunder: true, foretagskunder: true, solceller: true, serviceomrade: "Norra Åland" }, verified: true },
  { name: "Skärgårdens Elservice", slug: "skargardens-elservice", category: "elektriker", municipality: "kumlinge", city: "Kumlinge", address: "Bygdevägen 4", postalCode: "22820", short: "Elektriker för skärgården – Kumlinge, Brändö och Vårdö.", description: "Liten elfirma som tar uppdrag i hela östra skärgården. Vi planerar rutter efter färjetidtabellerna så att även små jobb blir gjorda.", phone: "+358 18 121015", email: "el@skargardsel.example.ax", hours: H.workshop, tags: ["skärgård", "elinstallation"], attributes: { akutservice: false, privatkunder: true, serviceomrade: "Östra skärgården" } },

  // --- VVS ---
  { name: "VVS-Service Åland", slug: "vvs-service-aland", category: "vvs", municipality: "jomala", city: "Prestgården", address: "Rörvägen 1", postalCode: "22150", short: "Rörmokare med jour – värme, vatten och avlopp.", description: "Komplett VVS-firma: badrum, bergvärme, avloppsspolning och akuta vattenläckor. Jourtelefon kvällar och helger.", phone: "+358 18 121016", email: "jour@vvsaland.example.ax", website: "https://vvsaland.example.ax", hours: H.workshop, tags: ["rörmokare", "jour", "bergvärme", "avlopp"], attributes: { akutservice: true, privatkunder: true, foretagskunder: true }, verified: true, services: [{ name: "Akut vattenläcka", priceText: "jourtaxa" }, { name: "Värmepumpsinstallation", priceText: "offert" }] },

  // --- Painting ---
  { name: "Måleri Lindqvist", slug: "maleri-lindqvist", category: "maleri", municipality: "hammarland", city: "Kattby", address: "Kattbyvägen 6", postalCode: "22240", short: "In- och utvändigt måleri, tapetsering och fasader.", description: "Målerifirma med tre anställda. Traditionell slamfärg på ladugårdar lika gärna som moderna våtrumstapeter.", phone: "+358 18 121017", email: "info@malerilindqvist.example.ax", hours: H.workshop, tags: ["måleri", "tapetsering", "fasad"], verified: true },

  // --- Cleaning ---
  { name: "Rena Hem Åland", slug: "rena-hem-aland", category: "stadning", municipality: "mariehamn", city: "Mariehamn", address: "Städargränd 2", postalCode: "22100", short: "Hemstäd, flyttstäd och kontorsstäd med miljömärkta medel.", description: "Städföretag med nöjd-kund-garanti. Regelbunden hemstädning, flyttstädning med besiktningsgaranti och kontorsavtal.", phone: "+358 18 121018", email: "bokning@renahem.example.ax", website: "https://renahem.example.ax", hours: H.office, tags: ["hemstäd", "flyttstäd", "kontorsstäd", "miljömärkt"], attributes: { privatkunder: true, foretagskunder: true }, verified: true, premium: true, services: [{ name: "Hemstädning", priceText: "från 35 €/h" }, { name: "Flyttstädning", priceText: "från 250 €" }] },
  { name: "Skärgårdsstäd", slug: "skargardsstad", category: "stadning", municipality: "lemland", city: "Söderby", address: "Söderbyvägen 9", postalCode: "22610", short: "Stugstäd och fönsterputs i Lemland och Lumparland.", description: "Städservice specialiserad på stugbyten för uthyrningsstugor samt fönsterputs.", phone: "+358 18 121019", email: "info@skargardsstad.example.ax", hours: H.office, tags: ["stugstäd", "fönsterputs"] },

  // --- Property care ---
  { name: "Fastighetsservice Norra Åland", slug: "fastighetsservice-norra-aland", category: "fastighetsskotsel", municipality: "saltvik", city: "Haraldsby", address: "Haraldsbyvägen 3", postalCode: "22430", short: "Gräsklippning, snöröjning och fastighetsjour.", description: "Sköter fastigheter åt bostadsbolag och privatpersoner: gräsmattor, häckar, snöröjning, sandning och mindre reparationer.", phone: "+358 18 121020", email: "info@fsnorra.example.ax", hours: H.workshop, tags: ["snöröjning", "gräsklippning", "trädgård"], verified: true },

  // --- Car repair ---
  { name: "Mariehamns Bilverkstad", slug: "mariehamns-bilverkstad", category: "bilverkstader", extraCategories: ["dack-och-bilservice"], municipality: "mariehamn", city: "Mariehamn", address: "Motorvägen 7", postalCode: "22100", short: "Fullservice bilverkstad – service, diagnos och besiktningsfix.", description: "Auktoriserad verkstad för de flesta bilmärken. Motordiagnos, AC-service, fyrhjulsmätning och däckhotell. Lånebil vid service.", phone: "+358 18 121021", email: "verkstad@mhbil.example.ax", website: "https://mhbil.example.ax", hours: H.workshop, tags: ["bilservice", "besiktning", "däckhotell", "AC-service"], attributes: { lanebil: true, dackhotell: true }, verified: true, premium: true, services: [{ name: "Årsservice", priceText: "från 189 €" }, { name: "Däckbyte", priceText: "från 45 €" }], latOffset: 0.006, lngOffset: 0.005 },
  { name: "Jomala Motor & Däck", slug: "jomala-motor-dack", category: "bilverkstader", extraCategories: ["dack-och-bilservice"], municipality: "jomala", city: "Sviby", address: "Svibyvägen 14", postalCode: "22150", short: "Bilreparationer och däckservice nära flygfältet.", description: "Verkstad med snabba tider för däckbyten, bromsar och avgassystem. Drop-in för hjulskifte i säsong.", phone: "+358 18 121022", email: "info@jomalamotor.example.ax", hours: H.workshop, tags: ["däckbyte", "bromsar", "drop-in"], verified: true },
  { name: "Eckerö Bil & Marin", slug: "eckero-bil-marin", category: "bilverkstader", extraCategories: ["batar-och-marina-tjanster"], municipality: "eckero", city: "Storby", address: "Verkstadsvägen 1", postalCode: "22270", short: "Service av både bilar och båtmotorer på västra Åland.", description: "Kombinerad bil- och båtmotorverkstad. Vinterförvaring av båtar och service av utombordare.", phone: "+358 18 121023", email: "service@eckerobilmarin.example.ax", hours: H.workshop, tags: ["båtmotor", "bilservice", "vinterförvaring"] },

  // --- Car sales ---
  { name: "Ålands Bilcenter", slug: "alands-bilcenter", category: "bilforsaljning", municipality: "jomala", city: "Sviby", address: "Bilvägen 2", postalCode: "22150", short: "Begagnade bilar med garanti och finansiering.", description: "Ett av Ålands största utbud av begagnade personbilar. Alla bilar levereras servade, besiktade och med garanti.", phone: "+358 18 121024", email: "salj@bilcenter.example.ax", website: "https://bilcenter.example.ax", hours: H.shop, tags: ["begagnade bilar", "finansiering", "inbyte"], verified: true },

  // --- Hairdressers ---
  { name: "Salong Vågen", slug: "salong-vagen", category: "frisorer", municipality: "mariehamn", city: "Mariehamn", address: "Skarpansvägen 18", postalCode: "22100", short: "Modern frisörsalong för hela familjen – boka online.", description: "Salong med fyra stolar, färgspecialister och barberarhörna. Onlinebokning dygnet runt, drop-in när det finns lediga tider.", phone: "+358 18 121025", email: "boka@salongvagen.example.ax", website: "https://salongvagen.example.ax", hours: H.salon, tags: ["klippning", "färgning", "barberare", "onlinebokning"], attributes: { onlinebokning: true, dropin: true }, verified: true, premium: true, services: [{ name: "Damklippning", priceText: "från 45 €" }, { name: "Herrklippning", priceText: "från 32 €" }, { name: "Slingor", priceText: "från 85 €" }], bookingUrl: "https://salongvagen.example.ax/boka", latOffset: -0.003, lngOffset: 0.001 },
  { name: "Klipphörnan Godby", slug: "klipphornan-godby", category: "frisorer", municipality: "finstrom", city: "Godby", address: "Centrumvägen 5", postalCode: "22410", short: "Personlig frisör i Godby centrum.", description: "Liten salong med två frisörer. Klippning, färg och permanent till landsortspriser.", phone: "+358 18 121026", email: "klipphornan@example.ax", hours: H.salon, tags: ["klippning", "färgning"], verified: true },

  // --- Beauty & health ---
  { name: "Balans Massage & Friskvård", slug: "balans-massage", category: "skonhet-och-halsa", municipality: "mariehamn", city: "Mariehamn", address: "Ålandsvägen 31", postalCode: "22100", short: "Klassisk massage, idrottsmassage och zonterapi.", description: "Utbildad massör med tio års erfarenhet. Företagsavtal och presentkort finns.", phone: "+358 18 121027", email: "boka@balansmassage.example.ax", hours: H.salon, tags: ["massage", "friskvård", "presentkort"] },

  // --- Gym ---
  { name: "Träningshuset Åland", slug: "traningshuset-aland", category: "traning", municipality: "mariehamn", city: "Mariehamn", address: "Idrottsgatan 6", postalCode: "22100", short: "Gym med gruppass, PT och öppet 05–23 alla dagar.", description: "Fullt utrustat gym på 1200 m² med fria vikter, gruppass, cykelstudio och barnpassning vissa tider.", phone: "+358 18 121028", email: "info@traningshuset.example.ax", website: "https://traningshuset.example.ax", hours: { mon: [["05:00", "23:00"]], tue: [["05:00", "23:00"]], wed: [["05:00", "23:00"]], thu: [["05:00", "23:00"]], fri: [["05:00", "22:00"]], sat: [["07:00", "20:00"]], sun: [["07:00", "22:00"]] }, tags: ["gym", "gruppass", "PT", "barnpassning"], verified: true },

  // --- Accounting ---
  { name: "Räkenskap Ålands Redovisning", slug: "rakenskap-alands-redovisning", category: "redovisning", municipality: "mariehamn", city: "Mariehamn", address: "Nygatan 15", postalCode: "22100", short: "Bokföring, bokslut och löner för åländska småföretag.", description: "Redovisningsbyrå med sex anställda. Digital bokföring, momsdeklarationer, bokslut och rådgivning för allt från enskilda näringsidkare till aktiebolag.", phone: "+358 18 121029", email: "info@rakenskap.example.ax", website: "https://rakenskap.example.ax", hours: H.office, tags: ["bokföring", "bokslut", "löner", "deklaration"], attributes: { foretagskunder: true, digital: true }, verified: true, premium: true, services: [{ name: "Löpande bokföring", priceText: "från 95 €/mån" }, { name: "Bokslut", priceText: "offert" }] },
  { name: "Siffror & Sånt", slug: "siffror-och-sant", category: "redovisning", municipality: "lemland", city: "Söderby", address: "Byvägen 21", postalCode: "22610", short: "Personlig bokföringshjälp för småföretagare.", description: "Enmansbyrå som hjälper föreningar och småföretag med bokföring och deklarationer.", phone: "+358 18 121030", email: "hej@siffrorochsant.example.ax", hours: H.office, tags: ["bokföring", "föreningar"] },

  // --- Legal ---
  { name: "Advokatbyrå Öström", slug: "advokatbyra-ostrom", category: "juridik", municipality: "mariehamn", city: "Mariehamn", address: "Torggatan 3", postalCode: "22100", short: "Affärsjuridik, fastighetsrätt och familjerätt.", description: "Advokatbyrå med särskild erfarenhet av åländsk jordförvärvsrätt, bostadsköp och generationsväxlingar.", phone: "+358 18 121031", email: "byra@ostrom.example.ax", hours: H.office, tags: ["advokat", "fastighetsrätt", "familjerätt"], verified: true },

  // --- Grocery ---
  { name: "Närbutiken Vårdö Handel", slug: "narbutiken-vardo-handel", category: "livsmedel", extraCategories: ["butiker"], municipality: "vardo", city: "Vårdö", address: "Vårdövägen 12", postalCode: "22550", short: "Byabutik med livsmedel, post och bränsle.", description: "Vårdös enda matbutik: färskvaror, lokala produkter, postombud, apoteksservice och sjömack.", phone: "+358 18 121032", email: "butiken@vardohandel.example.ax", hours: H.grocery, tags: ["närbutik", "post", "bränsle", "lokala produkter"], verified: true },
  { name: "Kökar Lanthandel", slug: "kokar-lanthandel", category: "livsmedel", extraCategories: ["butiker"], municipality: "kokar", city: "Karlby", address: "Karlbyvägen 5", postalCode: "22730", short: "Skärgårdsbutik med det mesta – öppet året om.", description: "Lanthandel som servar bofasta och båtgäster med livsmedel, gasol, fiskeutrustning och glass på bryggan.", phone: "+358 18 121033", email: "info@kokarlanthandel.example.ax", hours: H.grocery, tags: ["lanthandel", "gasol", "båtgäster"] },

  // --- Clothing ---
  { name: "Modehuset Vind & Våg", slug: "modehuset-vind-och-vag", category: "klader", extraCategories: ["butiker"], municipality: "mariehamn", city: "Mariehamn", address: "Torggatan 8", postalCode: "22100", short: "Dam- och herrmode med skandinaviska märken.", description: "Klädbutik i gågatan med kvalitetsmode, egen skrädderiservice och personlig stilrådgivning.", phone: "+358 18 121034", email: "butik@vindochvag.example.ax", hours: H.shop, tags: ["mode", "skrädderi", "stilrådgivning"], verified: true },

  // --- Marine ---
  { name: "Marinservice Lumparn", slug: "marinservice-lumparn", category: "batar-och-marina-tjanster", municipality: "lumparland", city: "Klemetsby", address: "Hamnvägen 7", postalCode: "22630", short: "Båtservice, motorreparationer och vinterförvaring vid Lumparn.", description: "Fullservicevarv för fritidsbåtar: motorservice, glasfiberreparationer, bottenmålning och uppvärmd vinterförvaring.", phone: "+358 18 121035", email: "varv@lumparn.example.ax", website: "https://lumparn.example.ax", hours: H.workshop, tags: ["båtservice", "vinterförvaring", "utombordare"], attributes: { vinterforvaring: true, upptagning: true }, verified: true, services: [{ name: "Motorservice", priceText: "från 120 €" }, { name: "Vinterförvaring inomhus", priceText: "45 €/m²" }] },
  { name: "Rödhamns Gästhamn", slug: "rodhamns-gasthamn", category: "gasthamnar", municipality: "lemland", city: "Rödhamn", address: "Rödhamn", postalCode: "22610", short: "Naturhamn med bastu och café i södra skärgården.", description: "Klassisk gästhamn på seglingsleden mot Stockholm. 40 gästplatser, vedeldad bastu, sommarcafé och grillplatser (fiktivt exempel).", phone: "+358 18 121036", email: "hamn@rodhamn.example.ax", hours: H.none, tags: ["gästhamn", "bastu", "café", "natur"] },

  // --- Taxi & transport ---
  { name: "Ålands Taxitjänst", slug: "alands-taxitjanst", category: "taxi", extraCategories: ["transport"], municipality: "mariehamn", city: "Mariehamn", address: "Stationsvägen 1", postalCode: "22100", short: "Taxi dygnet runt – flygfält, färjor och sjukresor.", description: "Taxicentral med 15 bilar, förbeställning via app eller telefon. Rullstolstaxi och större bilar för grupper.", phone: "+358 18 121037", email: "bestall@taxitjanst.example.ax", hours: H.hotel, tags: ["taxi", "flygtaxi", "sjukresor", "dygnet runt"], verified: true },

  // --- IT ---
  { name: "Skärgårdsbyte IT", slug: "skargardsbyte-it", category: "it-och-teknik", municipality: "mariehamn", city: "Mariehamn", address: "Teknikgränd 4", postalCode: "22100", short: "IT-support, webbplatser och molntjänster för småföretag.", description: "IT-byrå som sköter allt digitalt åt åländska småföretag: support, e-post, webbplatser och säkerhetskopiering.", phone: "+358 18 121038", email: "support@skargardsbyte.example.ax", website: "https://skargardsbyte.example.ax", hours: H.office, tags: ["it-support", "webbplats", "molntjänster"], verified: true },

  // --- Photo ---
  { name: "Fotograf Lina Sund", slug: "fotograf-lina-sund", category: "foto-och-video", municipality: "sund", city: "Finby", address: "Finbyvägen 8", postalCode: "22520", short: "Bröllop, porträtt och företagsfoto i hela Åland.", description: "Frilansfotograf med studio i Sund. Bröllopsreportage, familjeporträtt utomhus och bildbanker för företag.", phone: "+358 18 121039", email: "lina@fotografsund.example.ax", website: "https://fotografsund.example.ax", hours: H.none, tags: ["bröllop", "porträtt", "företagsfoto"] },

  // --- Entertainment / family ---
  { name: "Äventyrsön Åland", slug: "aventyrson-aland", category: "underhallning", extraCategories: ["barn-och-familj"], municipality: "jomala", city: "Önningeby", address: "Lekvägen 3", postalCode: "22150", short: "Höghöjdsbana, minigolf och lekland för hela familjen.", description: "Aktivitetspark med höghöjdsbana i tre nivåer, 18 håls äventyrsminigolf, inomhuslekland och sommarkiosk. Födelsedagspaket för barn.", phone: "+358 18 121040", email: "info@aventyrson.example.ax", website: "https://aventyrson.example.ax", hours: { mon: [], tue: [], wed: [["12:00", "18:00"]], thu: [["12:00", "18:00"]], fri: [["12:00", "19:00"]], sat: [["10:00", "19:00"]], sun: [["10:00", "17:00"]] }, tags: ["barnvänlig", "minigolf", "höghöjdsbana", "födelsedag"], attributes: { barnvanlig: true, inomhus: true, utomhus: true }, verified: true, premium: true },
];

async function main() {
  console.log("Seeding allt.ax …");

  // Clean slate (order matters for FK constraints).
  await prisma.$transaction([
    prisma.adClick.deleteMany(),
    prisma.adImpression.deleteMany(),
    prisma.profileView.deleteMany(),
    prisma.searchLog.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.businessClaim.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.offer.deleteMany(),
    prisma.event.deleteMany(),
    prisma.service.deleteMany(),
    prisma.businessImage.deleteMany(),
    prisma.businessCategory.deleteMany(),
    prisma.business.deleteMany(),
    prisma.category.deleteMany(),
    prisma.municipality.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Users
  const [admin, owner, user] = await Promise.all([
    prisma.user.create({
      data: { name: "Admin", email: "admin@allt.ax", role: Role.ADMIN, passwordHash: await bcrypt.hash("admin123", 10) },
    }),
    prisma.user.create({
      data: { name: "Erika Företagare", email: "foretag@example.ax", role: Role.BUSINESS_OWNER, passwordHash: await bcrypt.hash("foretag123", 10) },
    }),
    prisma.user.create({
      data: { name: "Anna Andersson", email: "anna@example.ax", role: Role.USER, passwordHash: await bcrypt.hash("user123", 10) },
    }),
  ]);

  // Municipalities
  const municipalities = new Map<string, { id: string; lat: number; lng: number }>();
  for (const m of MUNICIPALITIES) {
    const created = await prisma.municipality.create({
      data: { name: m.name, slug: m.slug, description: m.description, latitude: m.lat, longitude: m.lng },
    });
    municipalities.set(m.slug, { id: created.id, lat: m.lat, lng: m.lng });
  }

  // Categories
  const categories = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({
      data: { name: c.name, slug: c.slug, icon: c.icon, description: c.description },
    });
    categories.set(c.slug, created.id);
  }

  // Businesses
  const businessIds = new Map<string, string>();
  for (const b of BUSINESSES) {
    const muni = municipalities.get(b.municipality)!;
    const primaryCategoryId = categories.get(b.category)!;
    const created = await prisma.business.create({
      data: {
        name: b.name,
        slug: b.slug,
        legalName: `${b.name} (fiktivt demoföretag)`,
        businessId: null,
        description: b.description,
        shortDescription: b.short,
        primaryCategoryId,
        address: b.address,
        postalCode: b.postalCode,
        city: b.city,
        municipalityId: muni.id,
        latitude: muni.lat + (b.latOffset ?? (Math.random() - 0.5) * 0.01),
        longitude: muni.lng + (b.lngOffset ?? (Math.random() - 0.5) * 0.02),
        phone: b.phone,
        email: b.email,
        website: b.website ?? "",
        socialLinks: b.website ? { facebook: `https://facebook.com/example-${b.slug}` } : {},
        openingHours: b.hours as object,
        attributes: (b.attributes ?? {}) as object,
        tags: b.tags ?? [],
        bookingUrl: b.bookingUrl ?? "",
        verified: b.verified ?? false,
        premium: b.premium ?? false,
        demo: true,
        categories: {
          create: [
            { categoryId: primaryCategoryId, primary: true },
            ...(b.extraCategories ?? []).map((slug) => ({ categoryId: categories.get(slug)!, primary: false })),
          ],
        },
        services: { create: (b.services ?? []).map((s) => ({ name: s.name, description: s.description ?? "", priceText: s.priceText ?? "" })) },
      },
    });
    businessIds.set(b.slug, created.id);
  }

  // The demo business owner has claimed one business.
  await prisma.business.update({
    where: { slug: "el-karlsson" },
    data: { claimedByUserId: owner.id },
  });
  await prisma.businessClaim.create({
    data: {
      businessId: businessIds.get("el-karlsson")!,
      userId: owner.id,
      status: ClaimStatus.APPROVED,
      evidence: "Verifierad via företagets officiella e-postdomän (demo).",
      reviewedBy: admin.id,
      reviewedAt: daysFromNow(-20),
    },
  });
  // A pending claim for the admin to review.
  await prisma.businessClaim.create({
    data: {
      businessId: businessIds.get("salong-vagen")!,
      userId: user.id,
      status: ClaimStatus.PENDING,
      evidence: "Jag är ägare till salongen, ring mig på salongens nummer (demo).",
    },
  });

  // Offers
  const offers = [
    { slug: "el-karlsson", title: "Laddbox installerad – kampanjpris 590 €", description: "Komplett installation av laddbox inklusive 10 m kabeldragning. Gäller demo-kampanjperioden.", start: -7, end: 30 },
    { slug: "restaurang-sjokanten", title: "Skärgårdsmeny 2 för 1 på vardagar", description: "Ta med en vän – två skärgårdsmenyer till priset av en, måndag–torsdag kl 17–19.", start: -3, end: 21 },
    { slug: "salong-vagen", title: "20 % på färgbehandlingar i juli", description: "Alla färgbehandlingar med 20 % rabatt hela månaden. Boka online.", start: -10, end: 19 },
    { slug: "mariehamns-bilverkstad", title: "AC-service 89 € (ord. 129 €)", description: "Full AC-kontroll med påfyllning inför sommaren.", start: -5, end: 40 },
    { slug: "traningshuset-aland", title: "Sommarkort 3 månader 99 €", description: "Träna hela sommaren, inga bindningar.", start: -14, end: 45 },
    { slug: "rena-hem-aland", title: "Första hemstädningen -50 %", description: "Prova på-rabatt för nya kunder, gäller ordinarie hemstädning.", start: -2, end: 60 },
  ];
  for (const o of offers) {
    await prisma.offer.create({
      data: {
        businessId: businessIds.get(o.slug)!,
        title: o.title,
        description: o.description,
        startDate: daysFromNow(o.start),
        endDate: daysFromNow(o.end),
        active: true,
      },
    });
  }

  // Events
  const events = [
    { slug: "sjomanspuben-ankaret", eventSlug: "livemusik-pa-ankaret", title: "Livemusik: Skärgårdstrion (demo)", description: "Trubadurkväll med åländska visor och covers. Fri entré.", location: "Sjömanspuben Ankaret, Mariehamn", start: 2, end: 2 },
    { slug: "aventyrson-aland", eventSlug: "familjedag-aventyrson", title: "Familjedag på Äventyrsön (demo)", description: "Halva priset på höghöjdsbanan, ansiktsmålning och korvgrillning.", location: "Äventyrsön, Jomala", start: 5, end: 5 },
    { slug: "kastelholms-slottscafe", eventSlug: "medeltidsdag-kastelholm", title: "Medeltidsdag vid slottet (demo)", description: "Marknad, riddaruppvisning och medeltida musik vid Kastelholms slott.", location: "Kastelholm, Sund", start: 9, end: 10 },
    { slug: "traningshuset-aland", eventSlug: "utomhuspass-badhusparken", title: "Gratis utomhuspass i Badhusparken (demo)", description: "Öppet gruppass för alla nivåer. Ta med egen matta.", location: "Badhusparken, Mariehamn", start: 3, end: 3 },
    { slug: "rodhamns-gasthamn", eventSlug: "hamnfest-rodhamn", title: "Hamnfest i Rödhamn (demo)", description: "Grillkväll, bastu och allsång på bryggan för båtgäster.", location: "Rödhamns gästhamn, Lemland", start: 12, end: 12 },
    { slug: "vardshuset-degerby", eventSlug: "skargardsbuffe-degerby", title: "Skärgårdsbuffé med lokala producenter (demo)", description: "Buffé med fisk, lamm och åländska ostar. Förbokning krävs.", location: "Värdshuset Degerby, Föglö", start: 16, end: 16 },
  ];
  for (const e of events) {
    await prisma.event.create({
      data: {
        businessId: businessIds.get(e.slug)!,
        title: e.title,
        slug: e.eventSlug,
        description: e.description,
        location: e.location,
        startDate: daysFromNow(e.start),
        endDate: daysFromNow(e.end),
        active: true,
      },
    });
  }

  // Sponsored campaigns (all fictional demo campaigns)
  const campaigns = [
    {
      slug: "el-karlsson", name: "El-Karlsson – sökordet elektriker (demo)",
      keywords: ["elektriker", "eljour", "elinstallation", "laddbox", "solceller"],
      categorySlugs: ["elektriker"], municipalitySlugs: [], priority: 10, budget: 300, price: 150,
      start: -7, end: 30, status: CampaignStatus.ACTIVE,
    },
    {
      slug: "restaurang-sjokanten", name: "Sjökanten – lunch & restaurang Mariehamn (demo)",
      keywords: ["restaurang", "lunch", "mat", "middag", "dagens lunch"],
      categorySlugs: ["restauranger"], municipalitySlugs: ["mariehamn"], priority: 8, budget: 250, price: 125,
      start: -5, end: 25, status: CampaignStatus.ACTIVE,
    },
    {
      slug: "salong-vagen", name: "Salong Vågen – frisörsökningar (demo)",
      keywords: ["frisör", "klippning", "frisörer", "barberare"],
      categorySlugs: ["frisorer"], municipalitySlugs: [], priority: 7, budget: 200, price: 100,
      start: -10, end: 20, status: CampaignStatus.ACTIVE,
    },
    {
      slug: "mariehamns-bilverkstad", name: "MH Bilverkstad – bilservice (demo)",
      keywords: ["bilverkstad", "bilservice", "däck", "besiktning", "verkstad"],
      categorySlugs: ["bilverkstader", "dack-och-bilservice"], municipalitySlugs: [], priority: 9, budget: 280, price: 140,
      start: -3, end: 35, status: CampaignStatus.ACTIVE,
    },
    {
      slug: "hotell-alandsblick", name: "Ålandsblick – hotell & boende (demo)",
      keywords: ["hotell", "boende", "övernattning", "konferens", "bastu"],
      categorySlugs: ["hotell-och-boende"], municipalitySlugs: [], priority: 6, budget: 220, price: 110,
      start: -1, end: 45, status: CampaignStatus.ACTIVE,
    },
    {
      slug: "rena-hem-aland", name: "Rena Hem – städkampanj (pausad demo)",
      keywords: ["städning", "hemstäd", "flyttstäd"],
      categorySlugs: ["stadning"], municipalitySlugs: [], priority: 5, budget: 150, price: 75,
      start: -20, end: 20, status: CampaignStatus.PAUSED,
    },
    {
      slug: "traningshuset-aland", name: "Träningshuset – vårkampanj (avslutad demo)",
      keywords: ["gym", "träning"],
      categorySlugs: ["traning"], municipalitySlugs: [], priority: 5, budget: 180, price: 90,
      start: -90, end: -30, status: CampaignStatus.ENDED,
    },
  ];
  const campaignIds: string[] = [];
  for (const c of campaigns) {
    const created = await prisma.campaign.create({
      data: {
        businessId: businessIds.get(c.slug)!,
        name: c.name,
        campaignType: CampaignType.SEARCH_SPONSORED,
        startDate: daysFromNow(c.start),
        endDate: daysFromNow(c.end),
        status: c.status,
        targetKeywords: c.keywords,
        targetCategoryIds: c.categorySlugs.map((s) => categories.get(s)!),
        targetMunicipalityIds: c.municipalitySlugs.map((s) => municipalities.get(s)!.id),
        priority: c.priority,
        budget: c.budget,
        price: c.price,
      },
    });
    if (c.status === CampaignStatus.ACTIVE) campaignIds.push(created.id);
  }

  // A little history so dashboards aren't empty: search logs, profile views,
  // impressions and clicks spread over the last 14 days.
  const sampleQueries = [
    "elektriker", "frisör mariehamn", "restaurang öppet nu", "dagens lunch", "bilverkstad jomala",
    "städfirma", "hotell med bastu", "rörmokare", "gym", "massage", "taxi", "bokföring",
    "solceller", "däckbyte", "pizzeria", "gästhamn", "fotograf bröllop", "barnaktiviteter",
  ];
  const allBusinessIds = Array.from(businessIds.values());
  const searchLogRows = [];
  const profileViewRows = [];
  const impressionRows = [];
  const clickRows = [];
  for (let i = 0; i < 220; i++) {
    const created = new Date(now.getTime() - Math.random() * 14 * 86_400_000);
    searchLogRows.push({
      query: sampleQueries[i % sampleQueries.length],
      resultCount: 1 + Math.floor(Math.random() * 8),
      sessionId: `demo-${(i % 40) + 1}`,
      createdAt: created,
    });
  }
  // A few zero-result searches for the admin "gaps" view.
  for (const zq of ["hovslagare", "dronarfotografering vinter", "segelmakare jour"]) {
    searchLogRows.push({ query: zq, resultCount: 0, sessionId: "demo-zero", createdAt: daysFromNow(-1) });
  }
  for (let i = 0; i < 350; i++) {
    const created = new Date(now.getTime() - Math.random() * 14 * 86_400_000);
    profileViewRows.push({
      businessId: allBusinessIds[i % allBusinessIds.length],
      sessionId: `demo-${(i % 60) + 1}`,
      source: ["search", "category", "municipality", "direct"][i % 4],
      createdAt: created,
    });
  }
  for (let i = 0; i < 120; i++) {
    const created = new Date(now.getTime() - Math.random() * 12 * 86_400_000);
    impressionRows.push({
      campaignId: campaignIds[i % campaignIds.length],
      searchQuery: sampleQueries[i % sampleQueries.length],
      page: "search",
      sessionId: `demo-${(i % 40) + 1}`,
      createdAt: created,
    });
  }
  for (let i = 0; i < 38; i++) {
    const created = new Date(now.getTime() - Math.random() * 12 * 86_400_000);
    const campaignId = campaignIds[i % campaignIds.length];
    clickRows.push({
      campaignId,
      businessId: allBusinessIds[i % allBusinessIds.length],
      action: ["phone", "website", "profile", "email"][i % 4],
      sessionId: `demo-${(i % 30) + 1}`,
      createdAt: created,
    });
  }
  await prisma.searchLog.createMany({ data: searchLogRows });
  await prisma.profileView.createMany({ data: profileViewRows });
  await prisma.adImpression.createMany({ data: impressionRows });
  await prisma.adClick.createMany({ data: clickRows });
  // Sync denormalized counters with the generated history.
  for (const id of campaignIds) {
    const [imp, clk] = await Promise.all([
      prisma.adImpression.count({ where: { campaignId: id } }),
      prisma.adClick.count({ where: { campaignId: id } }),
    ]);
    await prisma.campaign.update({ where: { id }, data: { impressionCount: imp, clickCount: clk } });
  }

  console.log(`Seeded: ${MUNICIPALITIES.length} municipalities, ${CATEGORIES.length} categories, ${BUSINESSES.length} businesses, ${offers.length} offers, ${events.length} events, ${campaigns.length} campaigns.`);
  console.log("Demo accounts: admin@allt.ax/admin123, foretag@example.ax/foretag123, anna@example.ax/user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
