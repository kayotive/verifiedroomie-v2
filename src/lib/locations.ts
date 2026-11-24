// Cities and towns people can pick when posting a listing or saying where they are looking.
// Big states are split into several cities or towns, each with the areas around it.
// To add an area, add it to the right list. To add a city or town, add a new hub(...) line.

export type StateLocation = {
  state: string; // unique key saved with listings and profiles (the city or town name)
  capital: string; // text saved for searching, for example "Warri, Delta"
  display?: string; // how it is written after the area (defaults to the key)
  label?: string; // text in the drop-down
  areas: string[];
};

export const OTHER_AREA = "__other__";

function hub(
  key: string,
  stateName: string,
  areas: string,
  extra: Partial<StateLocation> = {}
): StateLocation {
  return {
    state: key,
    capital: `${key}, ${stateName}`,
    label: `${key} (${stateName})`,
    areas: areas.split("|").map((a) => a.trim()),
    ...extra,
  };
}

const RAW: StateLocation[] = [
  // FCT
  hub("FCT", "FCT", "Asokoro|Maitama|Wuse|Wuse II|Garki|Gwarinpa|Jabi|Utako|Kubwa|Lugbe|Jikwoyi|Karu|Nyanya|Karmo|Apo|Durumi|Life Camp|Katampe|Mabushi|Dutse|Lokogoma|Galadimawa|Kado|Mpape|Gwagwalada|Kuje|Bwari|Dei-Dei|Guzape|Wuye|Gaduwa|Idu|Gudu|Jahi|Central Area|Sabon Lugbe", { capital: "Abuja", display: "Abuja", label: "Abuja (FCT)" }),

  // Abia
  hub("Aba", "Abia", "Aba Town|Ariaria|Ngwa Road|Osisioma|Abayi|Eziama|Umuola|Faulks Road|Ogbor Hill|Port Harcourt Road|Ukwa|Isiala Ngwa|Ugwunagbo|Obingwa"),
  hub("Umuahia", "Abia", "Umuahia Town|Umudike (MOUAU)|Ubakala|Ibeku|Olokoro|Ohiya|Ahiaeke|Afara|Umuopara|Bende|Arochukwu|Uturu (Abia State University)|Isuikwuato|Ikwuano|Ohafia"),

  // Adamawa
  hub("Yola", "Adamawa", "Yola Town|Jimeta|Karewa|Bachure|Doubeli|Girei|Demsa|Mayo-Belwa|Numan|Ganye|Jambutu|Nasarawa Jimeta|Fufore|Song"),
  hub("Mubi", "Adamawa", "Mubi Town|Mubi North|Mubi South|Michika|Madagali|Maiha|Hong|Gombi"),

  // Akwa Ibom
  hub("Uyo", "Akwa Ibom", "Uyo Town|Ewet Housing|Shelter Afrique|Aka Road|Nwaniba Road|Abak Road|Oron Road|Ikot Ekpene Road|Ibiono Ibom|Itu|Etinan|Ikono|Uruan|Nsit Ubium|Ibesikpo"),
  hub("Eket", "Akwa Ibom", "Eket Town|Ibeno|Esit Eket|Onna|Mkpat Enin (AKSU)|Oron|Okobo|Urue Offong"),
  hub("Ikot Ekpene", "Akwa Ibom", "Ikot Ekpene Town|Abak|Essien Udim|Ukanafun|Obot Akara|Oruk Anam|Ika|Etim Ekpo"),

  // Anambra
  hub("Awka", "Anambra", "Awka Town|Amawbia|Nibo|Nise|Okpuno|Ifite Awka|Ezinato|Umuokpu|Mbaukwu|Amansea|Enugwu-Ukwu|Ekwulobia|Agulu|Nawfia|Isiagu"),
  hub("Nnewi", "Anambra", "Nnewi Town|Otolo|Uruagu|Umudim|Nkwo Nnewi|Ichi|Ozubulu|Ihiala|Uli (COOU)|Ukpor|Oraifite|Nnobi|Ekwusigo"),
  hub("Onitsha", "Anambra", "Onitsha Main Market|Fegge|Awada|Woliwo|GRA Onitsha|Nkpor|Obosi|Ogidi|Oba|Okpoko|Ochanja|Inland Town|Odoakpu|Upper Iweka|Igbariam (COOU)|Atani|Ogbaru|Ojoto"),

  // Bauchi
  hub("Bauchi", "Bauchi", "Bauchi Town|Yelwa|Gubi (ATBU)|Wunti|Makama|Kofar Wambai|Jos Road|Miri|Dass|Tafawa Balewa|Azare|Misau|Ningi|Toro|Katagum|Jama'are|Darazo|Gamawa|Alkaleri", { label: "Bauchi" }),

  // Bayelsa
  hub("Yenagoa", "Bayelsa", "Yenagoa Town|Amarata|Ekeki|Opolo|Okaka|Kpansia|Swali|Etegwe|Epie|Akenfa|Azikoro|Amassoma (Niger Delta University)|Otuoke (Federal University Otuoke)|Ogbia|Sagbama|Brass|Nembe|Ekeremor|Kolokuma"),

  // Benue
  hub("Makurdi", "Benue", "Makurdi Town|Wadata|North Bank|High Level|Wurukum|Fiidi|Apir|Guma|Gwer West|Gwer East|Tarka"),
  hub("Gboko", "Benue", "Gboko Town|Mkar|Yandev|Katsina-Ala|Vandeikya|Ukum|Logo|Kwande|Buruku"),
  hub("Otukpo", "Benue", "Otukpo Town|Adoka|Ugbokpo|Ochekwu|Aliade|Ogbadibo|Apa|Agatu|Ohimini|Okpokwu"),

  // Borno
  hub("Maiduguri", "Borno", "Maiduguri Town|Bulumkutu|Gwange|Shehuri|Mafoni|Pompomari|Jere|Konduga|Bama|Biu|Dikwa|Gwoza|Monguno|Damboa"),

  // Cross River
  hub("Calabar", "Cross River", "Calabar Municipal|Calabar South|Ekpo Abasi|Marian|Diamond Hill|Satellite Town|Akpabuyo|Big Qua Town|Eight Miles|Odukpani|Bakassi|Akamkpa|Biase"),
  hub("Ogoja", "Cross River", "Ogoja Town|Ikom|Obudu|Ugep|Obubra|Yakurr|Boki|Bekwarra|Yala|Abi|Etung"),

  // Delta
  hub("Asaba", "Delta", "Asaba Town|Okpanam|Ibusa|Ogwashi-Uku|Issele-Uku|Illah|Agbor|Umunede|Ubulu-Uku|Obiaruku|Kwale|Ndokwa|Aniocha|Oshimili|Ika"),
  hub("Warri", "Delta", "Warri Town|Effurun|Ekpan|Ovwian|Udu|Ugborikoko|Okumagba|Jakpa Road|Aladja|Ubeji|Enerhen|Osubi|Ugbomro|Otovwodo|Okere|Pessu|Airport Road|Ugbuwangue|Okuokoko|Uvwie"),
  hub("Abraka", "Delta", "Abraka (DELSU)|Sapele Town|Oghara|Ughelli|Otu-Jeremi|Agbarho|Orerokpe|Ethiope|Eku|Jesse|Okpe|Ogor|Oleh", { label: "Abraka and Sapele (Delta)" }),

  // Ebonyi
  hub("Abakaliki", "Ebonyi", "Abakaliki Town|Presco|Kpirikpiri|Water Works|Ezzamgbo|Ikwo|Ndufu-Alike (Federal University)|Onueke|Ishiagu|Effium|Ohaukwu|Izzi|Nkalagu"),
  hub("Afikpo", "Ebonyi", "Afikpo Town|Amasiri|Edda|Unwana|Ohaozara|Ivo|Uburu|Okposi"),

  // Edo
  hub("Benin City", "Edo", "Aduwawa|Ugbowo (UNIBEN)|Ekosodin|Uselu|Ikpoba Hill|Ogida|Sapele Road|Airport Road|GRA|Oka|Egor|Ring Road|New Benin|Siluko Road|Uwelu|Iyaro|Evbuotubu|Isiohor|Okhoro|Textile Mill Road|Upper Mission|Dawson Road|Ihama|Ekenwan"),
  hub("Ekpoma", "Edo", "Ekpoma Town|AAU Campus|Ujemen|Emaudo|Iruekpen|Ihumudumu|Ukhun|Eguare|Irrua|Uromi|Ubiaja|Ewu|Igueben|Ogwa|Ugboha"),
  hub("Auchi", "Edo", "Auchi Town|Auchi Polytechnic Area|Iyamho (Edo State University)|Jattu|Igarra|Fugar|Agenebode|Okpella|Ibillo|South Ibie|Afuze"),

  // Ekiti
  hub("Ado-Ekiti", "Ekiti", "Ado-Ekiti Town|Ajilosun|Okesa|Basiri|Ijigbo|Oke-Ila|Ikere-Ekiti (BOUESTI)|Ikole-Ekiti (FUOYE)|Oye-Ekiti (FUOYE)|Aramoko|Ijero|Efon-Alaaye|Ise-Ekiti|Iyin-Ekiti|Ilawe-Ekiti|Igede-Ekiti|Omuo-Ekiti"),

  // Enugu
  hub("Enugu", "Enugu", "Independence Layout|GRA|Trans-Ekulu|New Haven|Achara Layout|Abakpa|Uwani|Ogui|Emene|Awkunanaw|Coal Camp|Obiagu|Maryland|Thinkers Corner|Ugwuaji|Amechi|Agbani (ESUT)|Ugwuomu-Nike (Godfrey Okoye University)|Amorji-Nike (Caritas University)|Ngwo", { label: "Enugu" }),
  hub("Nsukka", "Enugu", "Nsukka Town|Odenigwe|Ibagwa-Aka|Obukpa|Edem|Opi|Ogurugu|Nru|Lejja|Obollo-Afor|Orba|Eha-Amufu|Enugu-Ezike"),

  // Gombe
  hub("Gombe", "Gombe", "Gombe Town|Pantami|Jekadafari|Tudun Wada|Bogo|Kumo|Billiri|Kaltungo|Dukku|Bajoga|Kashere (Federal University)|Akko|Nafada|Deba", { label: "Gombe" }),

  // Imo
  hub("Owerri", "Imo", "Owerri Municipal|Aladinma|Orji|Egbu|Naze|Ikenegbu|Nekede (FUTO)|Ihiagwa (FUTO)|Umuguma|Amakohia|World Bank|Douglas Road|Emekuku|Mgbidi|Oguta|Ikeduru|Ngor-Okpala|Mbaitoli|Avu|Uratta"),
  hub("Orlu", "Imo", "Orlu Town|Mgbee|Umuowa|Ihioma|Nkwerre|Okigwe|Isu|Oru East|Oru West|Njaba|Ideato|Isiala Mbano"),

  // Jigawa
  hub("Dutse", "Jigawa", "Dutse Town|Hadejia|Gumel|Kazaure|Ringim|Birnin Kudu|Kiyawa|Gwaram|Babura|Birniwa|Kafin Hausa|Jahun|Taura"),

  // Kaduna
  hub("Kaduna", "Kaduna", "Barnawa|Ungwan Rimi|Malali|Television|Sabon Tasha|Kawo|Narayi|Rigasa|Ungwan Sarki|Kakuri|Gonin Gora|Badarawa|Ungwan Boro|Millennium City|Kabala West|Kudende|Mando|Tudun Wada|Sabon Gari|NDA Area|Ungwan Muazu", { label: "Kaduna" }),
  hub("Zaria", "Kaduna", "Samaru (ABU)|Sabon Gari|Zaria City|Tudun Wada|Kongo|Hanwa|Gyallesu|Shika (ABU)|Basawa|Dambo|Tudun Jukun|Wusasa|Palladan"),
  hub("Kafanchan", "Kaduna", "Kafanchan Town|Kagoro|Jema'a|Zonkwa|Kaura|Kachia|Kagarko|Sanga|Gwantu"),

  // Kano
  hub("Kano", "Kano", "Nasarawa GRA|Sabon Gari|Fagge|Tarauni|Dala|Gwale|Ungogo|Kumbotso|Hotoro|Bompai|Sharada|Gyadi-Gyadi|Zoo Road|Kofar Mazugal|Bichi|Wudil (KUST)|Madobi|Challawa|Dorayi|France Road|Farm Centre|Mariri|Rimin Gado|Bayero University Old Site|Bayero University New Site", { label: "Kano" }),

  // Katsina
  hub("Katsina", "Katsina", "Katsina City|Kofar Marusa|Kofar Kaura|Dutsin-Ma (Federal University)|Daura|Funtua|Malumfashi|Kankia|Mani|Batsari|Kafur|Bakori|Danja|Mashi|Jibia", { label: "Katsina" }),

  // Kebbi
  hub("Birnin Kebbi", "Kebbi", "Birnin Kebbi Town|Argungu|Yauri (Federal University)|Zuru|Jega|Koko|Bagudo|Gwandu|Kalgo|Bunza|Aliero (KSUSTA)"),

  // Kogi
  hub("Lokoja", "Kogi", "Lokoja Town|Adankolo|Felele|Ganaja|Kabawa|Zango|Koton Karfe|Kabba|Isanlu|Obajana|Ajaokuta|Mopa|Yagba"),
  hub("Okene", "Kogi", "Okene Town|Adavi|Okehi|Ogori-Magongo|Ihima|Obehira|Eika|Ogaminana|Egbe"),
  hub("Anyigba", "Kogi", "Anyigba (Kogi State University)|Dekina|Ayingba|Idah|Ankpa|Ofu|Olamaboro|Igalamela|Omala|Bassa"),

  // Kwara
  hub("Ilorin", "Kwara", "Tanke (UNILORIN)|Fate|Sango|Taiwo Road|Ganmo|Oloje|Oke-Odo|Adewole|Gaa Akanbi|Basin|GRA|Unity Road|Mandate|Surulere|Oja Oba|Pipeline|Amilegbe|Agbo Oba|Isale Koko|Ipata|Gaa-Imam|Offa Garage|Kulende|Sabo Oke"),
  hub("Offa", "Kwara", "Offa Town|Erinle|Oyun|Ojoku|Omu-Aran (Landmark University)|Malete (Kwara State University)|Igbaja|Ora|Ipee|Isanlu-Isin|Jebba|Patigi|Kaiama|Share|Lafiagi|Ilesha-Baruba"),

  // Lagos
  hub("Lagos Mainland", "Lagos", "Ikeja|Maryland|Ogba|Agege|Ojodu|Berger|Ketu|Mile Twelve|Oregun|Ilupeju|Palmgrove|Somolu|Bariga|Gbagada|Magodo|Anthony|Surulere|Yaba|Akoka (UNILAG)|Ebute Metta|Oshodi|Isolo|Mushin|Ejigbo|Okota|Ogudu|Ojota|Apapa|Ajegunle|Orile|Iganmu", { display: "Lagos", label: "Lagos Mainland" }),
  hub("Lagos Island and Lekki", "Lagos", "Lagos Island|Obalende|Victoria Island|Ikoyi|Lekki|Lekki Phase One|Ajah|Sangotedo|Chevron|Oniru|Banana Island|Ibeju-Lekki (Pan-Atlantic University)|Ikate|Jakande|Osapa London|Agungi|Awoyaya|Abraham Adesanya|Badore|Addo|Idado|Eleko", { display: "Lagos", label: "Lagos Island and Lekki" }),
  hub("Ikorodu and Epe", "Lagos", "Ikorodu Town|LASUSTECH Campus|Igbogbo|Ijede|Imota|Odogunyan|Majidun|Itamaga|Agric|Ikorodu Garage|Epe Town|Eredo|Itoikin", { display: "Lagos" }),
  hub("Ojo and Badagry", "Lagos", "Ojo (LASU)|Alaba|Festac|Amuwo-Odofin|Satellite Town|Ago Palace Way|Okokomaiko|Igando|Egbe|Ikotun|Ipaja|Iyana-Ipaja|Alimosho|Abule Egba|Meiran|Ayobo|Dopemu|Idimu|Akowonjo|Egbeda|Badagry|Ajara", { display: "Lagos" }),

  // Nasarawa
  hub("Lafia", "Nasarawa", "Lafia Town|Shabu|Bukan Sidi|Doma|Obi|Akwanga|Wamba|Nasarawa Eggon|Federal University Lafia Area|Awe|Keana"),
  hub("Keffi", "Nasarawa", "Keffi Town|Nasarawa Town|Toto|Gudi|Kokona|NSUK Campus"),
  hub("Mararaba", "Nasarawa", "Mararaba|Masaka|New Karu|Gurku|Uke|Auta Balefi|Ado|Karshi"),

  // Niger
  hub("Minna", "Niger", "Minna Town|Bosso|Chanchaga|Tunga|Maitumbi|Kpakungu|Barkin Sale|Gidan Kwano (FUT Minna)|Tunga Maje|Paiko|Shiroro|Rafi|Gurara"),
  hub("Suleja", "Niger", "Suleja Town|Madalla|Tafa|Gauraka"),
  hub("Bida", "Niger", "Bida Town|Lapai (IBB University)|Mokwa|Kontagora|New Bussa|Tegina|Kuta|Wushishi|Agaie|Lavun|Borgu"),

  // Ogun
  hub("Abeokuta", "Ogun", "Abeokuta Town|Lafenwa|Ibara|Asero|Idi-Aba|Kuto|Onikolobo|Adatan|Panseke|Oke-Mosan|Isale Igbehin|Obantoko|Alabata (FUNAAB)|Odeda|Ajebo|Oke-Aregba|Sapon|Ita-Oshin|Lantoro"),
  hub("Ota", "Ogun", "Ota Town|Ota (Covenant University)|Ota (Bells University)|Sango-Ota|Ifo|Mowe|Ibafo|Ewekoro|Agbara|Redemption Camp|Magboro|Arepo|Isheri|Ilaro (Federal Polytechnic)|Igbesa (Crawford University)|Ayetoro|Idiroko|Ado-Odo"),
  hub("Sagamu", "Ogun", "Sagamu Town|Ikenne|Ilishan-Remo (Babcock University)|Iperu|Ode-Remo|Isara|Ogere|Makun"),
  hub("Ijebu-Ode", "Ogun", "Ijebu-Ode Town|Ijagun (TASUED)|Ago-Iwoye (OOU)|Ijebu-Igbo|Odogbolu|Ijebu East|Ijebu North|Atan"),

  // Ondo
  hub("Akure", "Ondo", "Akure Town|FUTA Area|Alagbaka|Oba-Ile|Ijapo Estate|Oda Road|Aule|Igoba|Ilara-Mokin|Idanre|Ifon|Ondo Road|Ado Road"),
  hub("Ondo City", "Ondo", "Ondo Town|Ore|Okitipupa|Ilaje|Igbokoda|Odigbo|Ode-Irele|Irele"),
  hub("Owo", "Ondo", "Owo Town|Akungba-Akoko (AAUA)|Ikare-Akoko|Oka-Akoko|Ogbagi-Akoko|Ose|Ifedore"),

  // Osun
  hub("Osogbo", "Osun", "Osogbo Town|Oke-Baale|Oke-Fia (UNIOSUN)|Ota-Efun|Ilobu|Ikirun|Ede|Iree|Ejigbo|Iwo|Ila-Orangun|Ikire|Gbongan"),
  hub("Ile-Ife", "Osun", "Ife Town|OAU Campus|Modakeke|Ilode|Lagere|Mayfair|Parakin|Ondo Road|Ipetumodu (Oduduwa University)|Asipa"),
  hub("Ilesa", "Osun", "Ilesa Town|Atakumosa|Ijebu-Jesa|Ibokun|Esa-Oke|Ipetu-Ijesa|Oriade|Obokun"),

  // Oyo
  hub("Ibadan", "Oyo", "Bodija|Agodi|Ring Road|Dugbe|Mokola|Challenge|Apata|Iwo Road|Sango|Samonda|Akobo|Ologuneru|Eleyele|Moniya|Oje|Ojoo|Agbowo|Jericho|Iyaganku|Egbeda|Akinyele|Mapo|Basorun|Felele|Oluyole|Orogun|Awolowo Road|UI Campus"),
  hub("Ogbomoso", "Oyo", "Ogbomoso Town|LAUTECH Campus|Ogbomoso North|Ogbomoso South|Surulere|Ogo Oluwa|Oriire|Ikoyi-Ile"),
  hub("Oyo Town", "Oyo", "Oyo Town|Oyo (Ajayi Crowther University)|Saki|Iseyin|Igboho|Eruwa|Igbo-Ora|Ibarapa|Ago-Are|Kishi|Fiditi"),

  // Plateau
  hub("Jos", "Plateau", "Jos Town|Bukuru|Rayfield|Bauchi Road|Terminus|Angwan Rukuba|Zaria Road|Gada Biyu|Anglo-Jos|Naraguta (UNIJOS)|Rukuba Road|Hill Station|Tudun Wada|Barkin Ladi|Mangu|Pankshin|Shendam|Langtang|Wase|Bokkos|Gyel|Jos South"),

  // Rivers
  hub("Port Harcourt", "Rivers", "Old GRA|New GRA|Trans Amadi|Rumuola|Rumuokoro|Rumuigbo|Ada George|Eleme|Oyigbo|Woji|Elelenwo|Choba (UNIPORT)|Aluu|Rukpokwu|Peter Odili Road|Rumuodara|Ozuoba|Borokiri|Diobu|Eliozu|Igwuruta|Bonny|Okrika|Ahoada|Bori|Omoku|Rumueme|Rumuagholu|Alakahia|Iwofe|Ikwerre Road|Mile One|Mile Three|Mile Four|D-Line|Nkpolu-Oroworukwo (Rivers State University)"),

  // Sokoto
  hub("Sokoto", "Sokoto", "Sokoto Town|Wamako|Gwadabawa|Tambuwal|Bodinga|Illela|Goronyo|Gada|Binji|Wurno|UDUS Campus|Mabera", { label: "Sokoto" }),

  // Taraba
  hub("Jalingo", "Taraba", "Jalingo Town|Sunkani|Mutum Biyu|Lau|Karim Lamido|Bali|Gembu|Zing|Yorro|Ardo-Kola|Gassol"),
  hub("Wukari", "Taraba", "Wukari Town|Wukari (Federal University)|Takum|Donga|Ibi|Ussa|Kurmi|Gassol"),

  // Yobe
  hub("Damaturu", "Yobe", "Damaturu Town|Potiskum|Gashua|Nguru|Geidam|Buni Yadi|Gujba|Fika|Nangere|Machina|Yobe State University Campus"),

  // Zamfara
  hub("Gusau", "Zamfara", "Gusau Town|Kaura Namoda|Talata Mafara|Anka|Tsafe|Bungudu|Maru|Shinkafi|Zurmi|Bakura|Gummi"),
];

export function stateLabel(l: StateLocation) {
  return l.label ?? `${l.state}`;
}

// How the area is written on a listing, for example "Lugbe, Abuja"
export function areaText(l: StateLocation, area: string) {
  return `${area}, ${l.display ?? l.state}`;
}

export const LOCATIONS: StateLocation[] = [...RAW].sort((a, b) =>
  stateLabel(a).localeCompare(stateLabel(b))
);

// How a seeker's search location is written, for example "Lugbe, Abuja" or "Anywhere in Warri"
export function lookingText(
  state: string | null | undefined,
  area: string | null | undefined
) {
  const loc = LOCATIONS.find((l) => l.state === state);
  if (!loc) return "";
  const place = loc.display ?? loc.state;
  return area ? `${area}, ${place}` : `Anywhere in ${place}`;
}