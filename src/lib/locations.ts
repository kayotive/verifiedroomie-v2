// States and the areas people can pick when posting a listing.
// To add an area, add it to the right list below.

export type StateLocation = {
  state: string; // saved with the listing
  capital: string; // saved for searching
  display?: string; // how the state is written after the area (defaults to the state name)
  label?: string; // text in the state drop-down (defaults to "Capital (State)")
  areas: string[];
};

export const OTHER_AREA = "__other__";

const RAW: StateLocation[] = [
  {
    state: "FCT",
    capital: "Abuja",
    display: "Abuja",
    areas: ["Asokoro", "Maitama", "Wuse", "Wuse II", "Garki", "Gwarinpa", "Jabi", "Utako", "Kubwa", "Lugbe", "Jikwoyi", "Karu", "Nyanya", "Karmo", "Apo", "Durumi", "Life Camp", "Katampe", "Mabushi", "Dutse", "Lokogoma", "Galadimawa", "Kado", "Mpape", "Gwagwalada", "Kuje", "Bwari", "Dei-Dei", "Guzape", "Wuye", "Gaduwa", "Idu", "Gudu", "Jahi", "Central Area", "Sabon Lugbe"],
  },
  { state: "Abia", capital: "Umuahia", areas: ["Umuahia", "Aba", "Ohafia", "Arochukwu", "Bende", "Osisioma", "Ukwa", "Isiala Ngwa", "Ikwuano", "Umunneochi", "Ariaria", "Abayi"] },
  { state: "Adamawa", capital: "Yola", areas: ["Yola", "Jimeta", "Mubi", "Numan", "Ganye", "Girei", "Mayo-Belwa", "Song", "Demsa", "Gombi"] },
  { state: "Akwa Ibom", capital: "Uyo", areas: ["Uyo", "Eket", "Ikot Ekpene", "Oron", "Abak", "Itu", "Etinan", "Ikot Abasi", "Ibeno", "Mkpat Enin"] },
  { state: "Anambra", capital: "Awka", areas: ["Awka", "Onitsha", "Nnewi", "Ekwulobia", "Ihiala", "Nkpor", "Obosi", "Ogidi", "Oba", "Agulu", "Amawbia", "Nibo", "Ukpor", "Igbo-Ukwu", "Otuocha"] },
  { state: "Bauchi", capital: "Bauchi", areas: ["Bauchi", "Azare", "Misau", "Jama'are", "Ningi", "Darazo", "Gamawa", "Toro", "Tafawa Balewa", "Alkaleri", "Dass"] },
  { state: "Bayelsa", capital: "Yenagoa", areas: ["Yenagoa", "Amarata", "Ekeki", "Opolo", "Okaka", "Kpansia", "Swali", "Etegwe", "Epie", "Ogbia", "Brass", "Sagbama", "Nembe", "Ekeremor"] },
  { state: "Benue", capital: "Makurdi", areas: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala", "Vandeikya", "Aliade", "Adikpo", "Wadata", "North Bank", "High Level", "Wurukum"] },
  { state: "Borno", capital: "Maiduguri", areas: ["Maiduguri", "Bama", "Biu", "Dikwa", "Gwoza", "Konduga", "Monguno", "Damboa", "Mafoni", "Gwange", "Bulumkutu", "Shehuri", "Jere"] },
  { state: "Cross River", capital: "Calabar", areas: ["Calabar", "Calabar South", "Ikom", "Ogoja", "Obudu", "Ugep", "Obubra", "Akamkpa", "Ikot Ishie", "Marian"] },
  { state: "Delta", capital: "Asaba", areas: ["Asaba", "Warri", "Effurun", "Ekpan", "Sapele", "Ughelli", "Agbor", "Abraka", "Ogwashi-Uku", "Oghara", "Okpanam", "Koko", "Burutu", "Kwale", "Orerokpe", "Udu", "Ovwian", "Aladja", "Obiaruku", "Issele-Uku", "Ibusa"] },
  { state: "Ebonyi", capital: "Abakaliki", areas: ["Abakaliki", "Afikpo", "Onueke", "Ezzamgbo", "Ishiagu", "Ikwo", "Ohaukwu", "Ivo", "Effium"] },
  { state: "Edo", capital: "Benin City", areas: ["Aduwawa", "Ugbowo", "Ekosodin", "Uselu", "Ikpoba Hill", "Ogida", "Sapele Road", "Airport Road", "GRA", "Oka", "Egor", "Ring Road", "New Benin", "Siluko Road", "Uwelu", "Iyaro", "Evbuotubu", "Auchi", "Ekpoma", "Uromi", "Igarra", "Irrua", "Ubiaja"] },
  { state: "Ekiti", capital: "Ado-Ekiti", areas: ["Ado-Ekiti", "Ikere-Ekiti", "Ijero-Ekiti", "Ikole-Ekiti", "Oye-Ekiti", "Omuo-Ekiti", "Aramoko-Ekiti", "Efon-Alaaye", "Iyin-Ekiti", "Ise-Ekiti", "Ilawe-Ekiti", "Igede-Ekiti"] },
  { state: "Enugu", capital: "Enugu", areas: ["Independence Layout", "GRA", "Trans-Ekulu", "New Haven", "Achara Layout", "Abakpa", "Uwani", "Ogui", "Emene", "Nsukka", "Agbani", "Awkunanaw", "Ngwo", "Coal Camp", "Obiagu", "Maryland", "Thinkers Corner", "Ugwuaji", "Amechi"] },
  { state: "Gombe", capital: "Gombe", areas: ["Gombe", "Kumo", "Billiri", "Dukku", "Bajoga", "Kaltungo", "Akko", "Nafada", "Deba"] },
  { state: "Imo", capital: "Owerri", areas: ["Owerri", "Orlu", "Okigwe", "Egbu", "Naze", "Ikenegbu", "Aladinma", "Orji", "Nekede", "Emekuku", "Mgbidi", "Oguta", "Umuguma", "Amakohia", "World Bank", "Douglas Road", "Ihiagwa"] },
  { state: "Jigawa", capital: "Dutse", areas: ["Dutse", "Hadejia", "Gumel", "Kazaure", "Ringim", "Birnin Kudu", "Kiyawa", "Gwaram", "Babura", "Birniwa"] },
  { state: "Kaduna", capital: "Kaduna", areas: ["Barnawa", "Ungwan Rimi", "Malali", "Television", "Sabon Tasha", "Kawo", "Narayi", "Rigasa", "Ungwan Sarki", "Kakuri", "Gonin Gora", "Zaria", "Samaru", "Sabon Gari", "Kafanchan", "Kagoro", "Millennium City", "Badarawa", "Ungwan Boro"] },
  { state: "Kano", capital: "Kano", areas: ["Nasarawa GRA", "Sabon Gari", "Fagge", "Tarauni", "Dala", "Gwale", "Ungogo", "Kumbotso", "Hotoro", "Bompai", "Sharada", "Gyadi-Gyadi", "Zoo Road", "Kofar Mazugal", "Bichi", "Wudil", "Madobi", "Challawa", "Dorayi", "France Road", "Farm Centre", "Mariri"] },
  { state: "Katsina", capital: "Katsina", areas: ["Katsina", "Daura", "Funtua", "Malumfashi", "Dutsin-Ma", "Kankia", "Mani", "Batsari", "Kafur", "Bakori"] },
  { state: "Kebbi", capital: "Birnin Kebbi", areas: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru", "Jega", "Koko", "Bagudo", "Gwandu", "Kalgo", "Bunza", "Aliero"] },
  { state: "Kogi", capital: "Lokoja", areas: ["Lokoja", "Okene", "Kabba", "Idah", "Ankpa", "Anyigba", "Dekina", "Koton Karfe", "Isanlu", "Ajaokuta", "Obajana"] },
  { state: "Kwara", capital: "Ilorin", areas: ["Ilorin", "Tanke", "Fate", "Sango", "Taiwo Road", "Ganmo", "Oloje", "Oke-Odo", "Offa", "Omu-Aran", "Jebba", "Pategi", "Kaiama", "Share", "Lafiagi", "Adewole", "Gaa Akanbi", "Basin", "GRA", "Unity Road", "Surulere"] },
  {
    state: "Lagos",
    capital: "Ikeja",
    label: "Lagos",
    areas: ["Ikeja", "Lekki", "Victoria Island", "Ikoyi", "Surulere", "Yaba", "Ajah", "Maryland", "Gbagada", "Magodo", "Ogba", "Agege", "Alimosho", "Ikorodu", "Badagry", "Epe", "Oshodi", "Isolo", "Mushin", "Festac", "Apapa", "Ojo", "Egbeda", "Ipaja", "Iyana-Ipaja", "Berger", "Ojodu", "Ketu", "Mile Twelve", "Anthony", "Oregun", "Lagos Island", "Ibeju-Lekki", "Sangotedo", "Chevron", "Oniru", "Ilupeju", "Palmgrove", "Somolu", "Bariga", "Ejigbo", "Okota", "Amuwo-Odofin", "Satellite Town", "Igando", "Egbe", "Ikotun", "Akowonjo", "Idimu", "Dopemu", "Abule Egba", "Meiran", "Ayobo", "Ebute Metta", "Obalende", "Ogudu", "Orile", "Ajegunle", "Jakande"],
  },
  { state: "Nasarawa", capital: "Lafia", areas: ["Lafia", "Keffi", "Akwanga", "Mararaba", "Masaka", "New Karu", "Doma", "Wamba", "Toto", "Obi", "Gurku", "Uke"] },
  { state: "Niger", capital: "Minna", areas: ["Minna", "Suleja", "Bida", "Kontagora", "Mokwa", "Lapai", "New Bussa", "Tegina", "Kuta", "Madalla", "Gwada", "Paiko", "Bosso", "Tunga Maje", "Chanchaga"] },
  { state: "Ogun", capital: "Abeokuta", areas: ["Abeokuta", "Ijebu-Ode", "Sagamu", "Ota", "Ifo", "Mowe", "Ibafo", "Ilaro", "Ayetoro", "Idiroko", "Ijebu-Igbo", "Ago-Iwoye", "Iperu", "Ewekoro", "Agbara", "Redemption Camp", "Magboro", "Arepo", "Isheri", "Kobape", "Oke-Mosan", "Panseke", "Adatan", "Lafenwa", "Ibara", "Asero", "Idi-Aba", "Kuto", "Onikolobo"] },
  { state: "Ondo", capital: "Akure", areas: ["Akure", "Ondo", "Owo", "Ikare-Akoko", "Ore", "Okitipupa", "Idanre", "Ifon", "Ilara-Mokin", "Oba-Ile", "Alagbaka", "Ijapo Estate", "Oda Road", "Igoba"] },
  { state: "Osun", capital: "Osogbo", areas: ["Osogbo", "Ile-Ife", "Ilesa", "Ede", "Iwo", "Ikirun", "Ejigbo", "Ila-Orangun", "Ikire", "Gbongan", "Modakeke", "Ilobu", "Iree"] },
  { state: "Oyo", capital: "Ibadan", areas: ["Bodija", "Agodi", "Ring Road", "Dugbe", "Mokola", "Challenge", "Apata", "Iwo Road", "Sango", "Samonda", "Akobo", "Ologuneru", "Eleyele", "Moniya", "Oje", "Ojoo", "Agbowo", "Jericho", "Iyaganku", "Ogbomoso", "Oyo Town", "Saki", "Iseyin", "Igboho", "Eruwa", "Egbeda", "Akinyele", "Mapo", "Basorun", "Felele"] },
  { state: "Plateau", capital: "Jos", areas: ["Jos", "Bukuru", "Rayfield", "Bauchi Road", "Terminus", "Angwan Rukuba", "Zaria Road", "Gada Biyu", "Anglo-Jos", "Naraguta", "Rukuba Road", "Hill Station", "Barkin Ladi", "Pankshin", "Shendam", "Langtang", "Wase", "Mangu"] },
  { state: "Rivers", capital: "Port Harcourt", areas: ["Old GRA", "New GRA", "Trans Amadi", "Rumuola", "Rumuokoro", "Rumuigbo", "Ada George", "Eleme", "Oyigbo", "Woji", "Elelenwo", "Obio-Akpor", "Choba", "Aluu", "Rukpokwu", "Peter Odili Road", "Rumuodara", "Ozuoba", "Borokiri", "Diobu", "Eliozu", "Igwuruta", "Bonny", "Okrika", "Ahoada", "Bori", "Omoku", "Rumueme", "Rumuagholu", "Alakahia", "Iwofe", "Ikwerre Road"] },
  { state: "Sokoto", capital: "Sokoto", areas: ["Sokoto", "Wurno", "Gwadabawa", "Tambuwal", "Wamako", "Bodinga", "Illela", "Goronyo", "Gada", "Binji"] },
  { state: "Taraba", capital: "Jalingo", areas: ["Jalingo", "Wukari", "Bali", "Takum", "Gembu", "Zing", "Ibi", "Mutum Biyu", "Lau", "Karim Lamido"] },
  { state: "Yobe", capital: "Damaturu", areas: ["Damaturu", "Potiskum", "Gashua", "Nguru", "Geidam", "Buni Yadi", "Gujba", "Fika", "Nangere", "Machina"] },
  { state: "Zamfara", capital: "Gusau", areas: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka", "Tsafe", "Bungudu", "Maru", "Shinkafi", "Zurmi", "Bakura", "Gummi"] },
];

export function stateLabel(l: StateLocation) {
  return l.label ?? (l.capital === l.state ? l.state : `${l.capital} (${l.state})`);
}

// How the area is written on a listing, for example "Lugbe, Abuja"
export function areaText(l: StateLocation, area: string) {
  return `${area}, ${l.display ?? l.state}`;
}

export const LOCATIONS: StateLocation[] = [...RAW].sort((a, b) =>
  stateLabel(a).localeCompare(stateLabel(b))
);