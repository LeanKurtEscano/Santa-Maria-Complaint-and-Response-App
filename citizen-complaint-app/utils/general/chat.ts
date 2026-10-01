type Lang = 'en' | 'tl';
type Reply = Record<Lang, string>;
type Rule = { test: (l: string) => boolean; reply: Reply };

const has = (l: string, words: string[]) => words.some((w) => l.includes(w));
const hasWord = (l: string, words: string[]) =>
  words.some((w) => new RegExp(`\\b${w}\\b`).test(l));

const RULES: Rule[] = [
  {
    test: (l) => has(l, ['reklamo', 'complaint']) && has(l, ['file', 'paano', 'how', 'submit', 'isumite']),
    reply: {
      tl: '📋 Para mag-file ng reklamo sa Santa Maria:\n\n1️⃣ Buksan ang "Mga Reklamo" tab sa ibaba\n2️⃣ I-tap ang "Magsumite ng Reklamo"\n3️⃣ Piliin ang kategorya ng iyong reklamo\n4️⃣ Isulat ang detalye — maging tiyak at malinaw\n5️⃣ Mag-attach ng larawan/dokumento kung mayroon\n6️⃣ I-tap ang Submit\n\nTatanggap ka ng notification kapag may update. ✅',
      en: '📋 To file a complaint in Santa Maria:\n\n1️⃣ Open the "Complaints" tab below\n2️⃣ Tap "Submit a Complaint"\n3️⃣ Choose your complaint category\n4️⃣ Write the details — be specific and clear\n5️⃣ Attach a photo/document if you have one\n6️⃣ Tap Submit\n\nYou will get a notification when there is an update. ✅',
    },
  },
  {
    test: (l) => has(l, ['status']) || (has(l, ['reklamo', 'complaint']) && has(l, ['track', 'ano na', 'update'])),
    reply: {
      tl: '🔍 Makikita ang status ng iyong reklamo sa "Mga Reklamo" tab.\n\nMga estado:\n🔵 Isinumite — natanggap na\n🟡 Sinusuri — isinasaalang-alang\n🟢 Nalutas — naresolba na\n🔴 Tinanggihan — may kulang na info\n\nMatatanggap ka ng push notification sa bawat pagbabago. 📲',
      en: '🔍 You can see the status of your complaint in the "Complaints" tab.\n\nStatuses:\n🔵 Submitted — received\n🟡 Under review — being evaluated\n🟢 Resolved — completed\n🔴 Rejected — missing information\n\nYou will get a push notification for every change. 📲',
    },
  },
  {
    test: (l) => has(l, ['clearance']),
    reply: {
      tl: '🏘️ Para makakuha ng Barangay Clearance:\n\n📍 Pumunta sa iyong barangay hall\n🕗 8:00 AM – 5:00 PM, Lunes–Biyernes\n\n📄 Mga kailangan:\n• Valid ID (kahit isa)\n• Proof of residency (kung bago)\n\n💵 Bayad: ₱50–₱100\n⏱️ Oras ng pagproseso: 15–30 minuto\n\n💡 Tip: Pumunta nang maaga para maiwasan ang pila!',
      en: '🏘️ To get a Barangay Clearance:\n\n📍 Go to your barangay hall\n🕗 8:00 AM – 5:00 PM, Monday–Friday\n\n📄 Requirements:\n• Valid ID (any one)\n• Proof of residency (if new)\n\n💵 Fee: ₱50–₱100\n⏱️ Processing time: 15–30 minutes\n\n💡 Tip: Go early to avoid the line!',
    },
  },
  {
    test: (l) => has(l, ['dokumento', 'document', 'cedula', 'certificate', 'permit', 'sertipiko']),
    reply: {
      tl: '📄 Mga dokumento sa Santa Maria:\n\n• Barangay Clearance → barangay hall\n• Cedula (CTC) → munisipyo\n• Business Permit → BPLO\n• Certificate of Residency → barangay hall\n• Building Permit → Engineering Office\n• Birth/Death/Marriage → Civil Registry\n\n📍 Munisipyo: Magsaysay Ave., Santa Maria\n🕗 8AM–5PM, Lunes–Biyernes',
      en: '📄 Documents in Santa Maria:\n\n• Barangay Clearance → barangay hall\n• Cedula (CTC) → municipal hall\n• Business Permit → BPLO\n• Certificate of Residency → barangay hall\n• Building Permit → Engineering Office\n• Birth/Death/Marriage → Civil Registry\n\n📍 Municipal Hall: Magsaysay Ave., Santa Maria\n🕗 8AM–5PM, Monday–Friday',
    },
  },
  {
    test: (l) => has(l, ['oras', 'schedule', 'bukas', 'open', 'hours', 'opisina', 'office', 'tanggapan']),
    reply: {
      tl: '🕗 Oras ng Munisipalidad ng Santa Maria:\n\n📅 Lunes – Biyernes: 8:00 AM – 5:00 PM\n❌ Sarado: Sabado, Linggo, at pista opisyal\n\nMga 24/7 na serbisyo:\n🚨 Emergency hotlines\n🌊 MDRRMO (disaster response)\n\nPara sa espesyal na schedule, makipag-ugnayan sa opisina. 📞',
      en: '🕗 Santa Maria Municipal Hall hours:\n\n📅 Monday – Friday: 8:00 AM – 5:00 PM\n❌ Closed: Saturday, Sunday, and holidays\n\n24/7 services:\n🚨 Emergency hotlines\n🌊 MDRRMO (disaster response)\n\nFor special schedules, please contact the office. 📞',
    },
  },
  {
    test: (l) => has(l, ['contact', 'hotline', 'numero', 'number', 'telepono', 'phone', 'makausap']),
    reply: {
      tl: '📞 Mga contact ng Santa Maria, Laguna:\n\n🏛️ Munisipyo → "Emergency" tab sa app\n🚒 BFP (Fire) → 09278028353\n👮 PNP (Pulisya) → 09156021629\n🌊 MDRRMO → 0930234234\n🏥 RHU → sa loob ng munisipyo\n\nPara sa kumpletong listahan, buksan ang "Hotlines" tab. 📱',
      en: '📞 Santa Maria, Laguna contacts:\n\n🏛️ Municipal Hall → "Emergency" tab in the app\n🚒 BFP (Fire) → 09278028353\n👮 PNP (Police) → 09156021629\n🌊 MDRRMO → 0930234234\n🏥 RHU → inside the municipal hall\n\nFor the complete list, open the "Hotlines" tab. 📱',
    },
  },
  {
    test: (l) => has(l, ['serbisyo', 'services', 'available']),
    reply: {
      tl: '🏛️ Mga serbisyo ng Munisipalidad ng Santa Maria:\n\n📋 Pagsasampa ng reklamo\n📄 Mga dokumento at permit\n💊 Pangunahing kalusugan (RHU)\n🌊 Disaster response (MDRRMO)\n🏗️ Engineering at imprastraktura\n📚 Social welfare (MSWDO)\n💼 Business permit at licensing\n🌿 Agricultural support (MAO)\n👶 Day care at programa para kabataan',
      en: '🏛️ Santa Maria Municipal services:\n\n📋 Filing complaints\n📄 Documents and permits\n💊 Basic health (RHU)\n🌊 Disaster response (MDRRMO)\n🏗️ Engineering and infrastructure\n📚 Social welfare (MSWDO)\n💼 Business permits and licensing\n🌿 Agricultural support (MAO)\n👶 Day care and youth programs',
    },
  },
  {
    test: (l) => has(l, ['opisyal', 'official', 'mayor', 'kapitan', 'captain', 'gobyerno', 'government']),
    reply: {
      tl: '🏛️ Ang Santa Maria ay pinamumunuan ng:\n\n• Municipal Mayor — pinakamataas na opisyal\n• Vice Mayor — namumuno sa Sangguniang Bayan\n• Mga Konsehal — gumagawa ng batas\n• Mga Kapitan — namumuno sa bawat barangay\n\nPara sa listahan ng opisyal, bisitahin ang opisyal na website ng Santa Maria o makipag-ugnayan sa munisipyo. 📢',
      en: '🏛️ Santa Maria is led by:\n\n• Municipal Mayor — highest official\n• Vice Mayor — heads the Sangguniang Bayan\n• Councilors — make local laws\n• Barangay Captains — lead each barangay\n\nFor the list of officials, visit the official Santa Maria website or contact the municipal hall. 📢',
    },
  },
  {
    test: (l) => has(l, ['saan', 'where', 'address', 'lokasyon', 'location']),
    reply: {
      tl: '📍 Munisipalidad ng Santa Maria\nMagsaysay Ave., Santa Maria, Laguna\n\n🗺️ Matatagpuan sa hilagang bahagi ng Laguna\n\nMga barangay ng Santa Maria:\nAmuyong, Bagong Bayan, Bubukal, Calios, Duhat, Ibabang Iyam, Ilayang Iyam, Kanluran, Labasan, Malinao, Malinta, Muzon, Palayan, Pulong Buhangin, Sto. Cristo, Talangka, at iba pa.\n\n🗺️ I-search sa Google Maps: "Santa Maria Municipal Hall, Laguna"',
      en: '📍 Municipality of Santa Maria\nMagsaysay Ave., Santa Maria, Laguna\n\n🗺️ Located in the northern part of Laguna\n\nBarangays of Santa Maria:\nAmuyong, Bagong Bayan, Bubukal, Calios, Duhat, Ibabang Iyam, Ilayang Iyam, Kanluran, Labasan, Malinao, Malinta, Muzon, Palayan, Pulong Buhangin, Sto. Cristo, Talangka, and others.\n\n🗺️ Search on Google Maps: "Santa Maria Municipal Hall, Laguna"',
    },
  },
  {
    test: (l) => has(l, ['baha', 'flood', 'bagyo', 'typhoon', 'sakuna', 'disaster', 'emergency', 'lindol', 'earthquake']),
    reply: {
      tl: '🚨 Para sa mga emergency sa Santa Maria:\n\n☎️ MDRRMO — available 24/7\n☎️ 911 — para sa agarang tulong\n\nKung may babala ng bagyo o baha:\n• Huwag lumabas kung hindi kinakailangan\n• Ihanda ang emergency kit\n• Sundan ang instruksyon ng barangay\n• Iulat ang delikadong sitwasyon sa MDRRMO\n\n⚠️ Para sa agarang tulong: 911',
      en: '🚨 For emergencies in Santa Maria:\n\n☎️ MDRRMO — available 24/7\n☎️ 911 — for immediate help\n\nIf there is a typhoon or flood warning:\n• Do not go out unless necessary\n• Prepare your emergency kit\n• Follow barangay instructions\n• Report dangerous situations to MDRRMO\n\n⚠️ For immediate help: 911',
    },
  },
  {
    test: (l) => has(l, ['kalusugan', 'health', 'rhu', 'doktor', 'doctor', 'bakuna', 'vaccine']),
    reply: {
      tl: '🏥 Serbisyong pangkalusugan sa Santa Maria:\n\nRural Health Unit (RHU)\n📍 Sa loob ng munisipyo\n🕗 8AM–5PM, Lunes–Biyernes\n\nMga serbisyo:\n💉 Bakuna (immunization)\n🤰 Prenatal at maternal care\n👶 Child health services\n💊 Free basic medicines\n🩺 Medical consultation\n\n🚑 Emergency: pumunta sa pinakamalapit na ospital o 911',
      en: '🏥 Health services in Santa Maria:\n\nRural Health Unit (RHU)\n📍 Inside the municipal hall\n🕗 8AM–5PM, Monday–Friday\n\nServices:\n💉 Vaccines (immunization)\n🤰 Prenatal and maternal care\n👶 Child health services\n💊 Free basic medicines\n🩺 Medical consultation\n\n🚑 Emergency: go to the nearest hospital or call 911',
    },
  },
  {
    test: (l) => has(l, ['bayad', 'magkano', 'how much', 'libre', 'free', 'fee']),
    reply: {
      tl: '💰 Impormasyon sa bayad:\n\n🆓 LIBRE:\n• Pagsasampa ng reklamo\n• Basic health consultation\n• Bakuna para sa bata\n• Social welfare assistance\n\n💵 MAY BAYAD:\n• Barangay Clearance: ₱50–₱100\n• Cedula: nakabatay sa kita\n• Business Permit: nakabatay sa negosyo\n• Building Permit: nakabatay sa proyekto\n\nPara sa eksaktong halaga, makipag-ugnayan sa opisina. 📞',
      en: '💰 Fee information:\n\n🆓 FREE:\n• Filing a complaint\n• Basic health consultation\n• Child vaccines\n• Social welfare assistance\n\n💵 WITH FEE:\n• Barangay Clearance: ₱50–₱100\n• Cedula: based on income\n• Business Permit: based on the business\n• Building Permit: based on the project\n\nFor exact amounts, please contact the office. 📞',
    },
  },
  {
    test: (l) => hasWord(l, ['hello', 'hi', 'hey']) || has(l, ['kumusta', 'magandang']),
    reply: {
      tl: 'Kamusta! 😊 Narito ako para sagutin ang iyong mga tanong tungkol sa:\n\n📋 Reklamo\n📄 Mga dokumento\n🏛️ Mga serbisyo\n📞 Contact numbers\n🗺️ Lokasyon ng Santa Maria\n\nAno ang maipaglilingkod ko sa iyo?',
      en: 'Hello! 😊 I\'m here to answer your questions about:\n\n📋 Complaints\n📄 Documents\n🏛️ Services\n📞 Contact numbers\n🗺️ Santa Maria\'s location\n\nHow can I help you?',
    },
  },
  {
    test: (l) => has(l, ['salamat', 'thank']),
    reply: {
      tl: 'Walang anuman! 🙏 Lagi kaming handa para tumulong. Kung mayroon pang ibang katanungan, huwag mag-atubiling magtanong. Mabuhay ang Santa Maria! 🇵🇭',
      en: 'You\'re welcome! 🙏 We\'re always ready to help. If you have any other questions, feel free to ask. Long live Santa Maria! 🇵🇭',
    },
  },
];

const FALLBACK: Reply = {
  tl: 'Pasensya na, hindi ko pa ganap na naiintindihan ang iyong tanong. 😔\n\nNarito ako para sa mga tanong tungkol sa:\n• Pagsasampa ng reklamo\n• Mga dokumento at permit\n• Mga serbisyo ng munisipyo\n• Oras ng opisina at contact\n• Lokasyon ng Santa Maria\n\nSubukan mong i-rephrase ang iyong tanong, o piliin mula sa mga mungkahi sa itaas. 👆',
  en: "Sorry, I don't fully understand your question yet. 😔\n\nI'm here for questions about:\n• Filing a complaint\n• Documents and permits\n• Municipal services\n• Office hours and contacts\n• Santa Maria's location\n\nTry rephrasing your question, or pick from the suggestions above. 👆",
};

export function getFaqReply(input: string, lang: string): string {
  const l = input.toLowerCase().trim();
  const key: Lang = lang.startsWith('en') ? 'en' : 'tl';
  const rule = RULES.find((r) => r.test(l));
  return (rule ? rule.reply : FALLBACK)[key];
}