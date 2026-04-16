
export function getFaqReply(input: string): string {
  const l = input.toLowerCase();
  if (
    (l.includes('reklamo') || l.includes('complaint')) &&
    (l.includes('file') || l.includes('paano') || l.includes('submit') || l.includes('isumite'))
  ) {
    return '📋 Para mag-file ng reklamo sa Santa Maria:\n\n1️⃣ Buksan ang "Mga Reklamo" tab sa ibaba\n2️⃣ I-tap ang "Magsumite ng Reklamo"\n3️⃣ Piliin ang kategorya ng iyong reklamo\n4️⃣ Isulat ang detalye — maging tiyak at malinaw\n5️⃣ Mag-attach ng larawan/dokumento kung mayroon\n6️⃣ I-tap ang Submit\n\nTatanggap ka ng notification kapag may update. ✅';
  }
  if (l.includes('status') || (l.includes('reklamo') && (l.includes('track') || l.includes('ano na') || l.includes('update')))) {
    return '🔍 Makikita ang status ng iyong reklamo sa "Mga Reklamo" tab.\n\nMga estado:\n🔵 Isinumite — natanggap na\n🟡 Sa Proseso — isinasaalang-alang\n🟢 Nalutas — naresolba na\n🔴 Tinanggihan — may kulang na info\n\nMatanggap ka ng push notification sa bawat pagbabago. 📲';
  }
  if (l.includes('clearance') || l.includes('barangay clearance')) {
    return '🏘️ Para makakuha ng Barangay Clearance:\n\n📍 Pumunta sa iyong barangay hall\n🕗 8:00 AM – 5:00 PM, Lunes–Biyernes\n\n📄 Mga kailangan:\n• Valid ID (kahit isa)\n• Proof of residency (kung bago)\n\n💵 Bayad: ₱50–₱100\n⏱️ Oras ng pagproseso: 15–30 minuto\n\n💡 Tip: Pumunta nang maaga para maiwasan ang pila!';
  }
  if (l.includes('dokumento') || l.includes('cedula') || l.includes('certificate') || l.includes('permit') || l.includes('sertipiko')) {
    return '📄 Mga dokumento sa Santa Maria:\n\n• Barangay Clearance → barangay hall\n• Cedula (CTC) → munisipyo\n• Business Permit → BPLO\n• Certificate of Residency → barangay hall\n• Building Permit → Engineering Office\n• Birth/Death/Marriage → Civil Registry\n\n📍 Munisipyo: Magsaysay Ave., Santa Maria\n🕗 8AM–5PM, Lunes–Biyernes';
  }
  if (l.includes('oras') || l.includes('schedule') || l.includes('bukas') || l.includes('open')) {
    return '🕗 Oras ng Munisipalidad ng Santa Maria:\n\n📅 Lunes – Biyernes: 8:00 AM – 5:00 PM\n❌ Sarado: Sabado, Linggo, at pista opisyal\n\nMga 24/7 na serbisyo:\n🚨 Emergency hotlines\n🌊 MDRRMO (disaster response)\n\nPara sa espesyal na schedule, makipag-ugnayan sa opisina. 📞';
  }
  if (l.includes('contact') || l.includes('hotline') || l.includes('numero') || l.includes('telepono') || l.includes('makausap')) {
    return '📞 Mga contact ng Santa Maria, Laguna:\n\n🏛️ Munisipyo → "Emergency" tab sa app\n🚒 BFP (Fire) → 09278028353\n👮 PNP (Pulisya) → 09156021629\n🌊 MDRRMO → 0930234234\n🏥 RHU → sa loob ng munisipyo\n\nPara sa kumpletong listahan, buksan ang "Hotlines" tab. 📱';
  }
  if (l.includes('serbisyo') || l.includes('services') || l.includes('available')) {
    return '🏛️ Mga serbisyo ng Munisipalidad ng Santa Maria:\n\n📋 Pagsasampa ng reklamo\n📄 Mga dokumento at permit\n💊 Pangunahing kalusugan (RHU)\n🌊 Disaster response (MDRRMO)\n🏗️ Engineering at imprastraktura\n📚 Social welfare (MSWDO)\n💼 Business permit at licensing\n🌿 Agricultural support (MAO)\n👶 Day care at programa para kabataan';
  }
  if (l.includes('opisyal') || l.includes('mayor') || l.includes('kapitan') || l.includes('gobyerno')) {
    return '🏛️ Ang Santa Maria ay pinamumunuan ng:\n\n• Municipal Mayor — pinakamataas na opisyal\n• Vice Mayor — namumuno sa Sangguniang Bayan\n• Mga Konsehal — gumagawa ng batas\n• Mga Kapitan — namumuno sa bawat barangay\n\nPara sa listahan ng opisyal, bisitahin ang opisyal na website ng Santa Maria o makipag-ugnayan sa munisipyo. 📢';
  }
  if (l.includes('saan') || l.includes('address') || l.includes('lokasyon') || l.includes('location')) {
    return '📍 Munisipalidad ng Santa Maria\nMagsaysay Ave., Santa Maria, Laguna\n\n🗺️ Matatagpuan sa hilagang bahagi ng Laguna\n\nMga barangay ng Santa Maria:\nAmuyong, Bagong Bayan, Bubukal, Calios, Duhat, Ibabang Iyam, Ilayang Iyam, Kanluran, Labasan, Malinao, Malinta, Muzon, Palayan, Pulong Buhangin, Sto. Cristo, Talangka, at iba pa.\n\n🗺️ I-search sa Google Maps: "Santa Maria Municipal Hall, Laguna"';
  }
  if (l.includes('baha') || l.includes('bagyo') || l.includes('sakuna') || l.includes('emergency') || l.includes('lindol')) {
    return '🚨 Para sa mga emergency sa Santa Maria:\n\n☎️ MDRRMO — available 24/7\n☎️ 911 — para sa agarang tulong\n\nKung may babala ng bagyo o baha:\n• Huwag lumabas kung hindi kinakailangan\n• Ihanda ang emergency kit\n• Sundan ang instruksyon ng barangay\n• Iulat ang delikadong sitwasyon sa MDRRMO\n\n⚠️ Para sa agarang tulong: 911';
  }
  if (l.includes('kalusugan') || l.includes('health') || l.includes('rhu') || l.includes('doktor') || l.includes('bakuna')) {
    return '🏥 Serbisyong pangkalusugan sa Santa Maria:\n\nRural Health Unit (RHU)\n📍 Sa loob ng munisipyo\n🕗 8AM–5PM, Lunes–Biyernes\n\nMga serbisyo:\n💉 Bakuna (immunization)\n🤰 Prenatal at maternal care\n👶 Child health services\n💊 Free basic medicines\n🩺 Medical consultation\n\n🚑 Emergency: pumunta sa pinakamalapit na ospital o 911';
  }
  if (l.includes('bayad') || l.includes('magkano') || l.includes('libre') || l.includes('fee')) {
    return '💰 Impormasyon sa bayad:\n\n🆓 LIBRE:\n• Pagsasampa ng reklamo\n• Basic health consultation\n• Bakuna para sa bata\n• Social welfare assistance\n\n💵 MAY BAYAD:\n• Barangay Clearance: ₱50–₱100\n• Cedula: nakabatay sa kita\n• Business Permit: nakabatay sa negosyo\n• Building Permit: nakabatay sa proyekto\n\nPara sa eksaktong halaga, makipag-ugnayan sa opisina. 📞';
  }
  if (l.includes('hello') || l.includes('hi') || l.includes('kumusta') || l.includes('magandang') || l === 'hey') {
    return 'Kamusta! 😊 Narito ako para sagutin ang iyong mga tanong tungkol sa:\n\n📋 Reklamo\n📄 Mga dokumento\n🏛️ Mga serbisyo\n📞 Contact numbers\n🗺️ Lokasyon ng Santa Maria\n\nAno ang maipaglilingkod ko sa iyo?';
  }
  if (l.includes('salamat') || l.includes('thank')) {
    return 'Walang anuman! 🙏 Lagi kaming handa para tumulong. Kung mayroon pang ibang katanungan, huwag mag-atubiling magtanong. Mabuhay ang Santa Maria! 🇵🇭';
  }
  return 'Pasensya na, hindi ko pa ganap na naiintindihan ang iyong tanong. 😔\n\nNarito ako para sa mga tanong tungkol sa:\n• Pagsasampa ng reklamo\n• Mga dokumento at permit\n• Mga serbisyo ng munisipyo\n• Oras ng opisina at contact\n• Lokasyon ng Santa Maria\n\nSubukan mong i-rephrase ang iyong tanong, o piliin mula sa mga mungkahi sa itaas. 👆';
}