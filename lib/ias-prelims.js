/* UPSC Civil Services (Preliminary) reading list: subjects, NCERT textbooks
   and their chapters, standard reference books, CSAT and past papers.

   NCERT chapter titles follow the full editions UPSC aspirants use. They
   were checked against the contents pages on ncert.nic.in (reprints
   2024-25 to 2026-27) for every book still published there; Class 6 and
   Class 9 social science and science come from the older editions, which
   NCERT has replaced with new-curriculum books. Current reprints have
   dropped some chapters (the 2022-23 rationalisation); those still appear
   here, since the older printings that contain them are the ones to read.

   Public reference data only. Your progress and notes live in the encrypted
   vault, never in this file. */
window.IAS_META = {
  updated: '2026-10-29',
  ncert: 'https://ncert.nic.in/textbook.php?'
};

window.IAS_SUBJECTS = [
  { id: 'hist', name: 'History', syl: 'History of India and Indian National Movement.' },
  { id: 'art', name: 'Art & Culture', syl: 'Asked under History of India: architecture, sculpture, painting, music, dance, literature, religion and philosophy.' },
  { id: 'geo', name: 'Geography', syl: 'Indian and World Geography — Physical, Social, Economic Geography of India and the World.' },
  { id: 'pol', name: 'Polity', syl: 'Indian Polity and Governance — Constitution, Political System, Panchayati Raj, Public Policy, Rights Issues, etc.' },
  { id: 'eco', name: 'Economy', syl: 'Economic and Social Development — Sustainable Development, Poverty, Inclusion, Demographics, Social Sector Initiatives, etc.' },
  { id: 'env', name: 'Environment', syl: 'General issues on Environmental Ecology, Bio-diversity and Climate Change — that do not require subject specialisation.' },
  { id: 'sci', name: 'Science & Tech', syl: 'General Science.' },
  { id: 'ca', name: 'Current Affairs', syl: 'Current events of national and international importance.' },
  { id: 'csat', name: 'CSAT', syl: 'Paper II, qualifying: you need 33%. Class X level maths and reasoning, plus comprehension.' },
  { id: 'pyq', name: 'Past papers', syl: 'Solve previous years’ papers under exam conditions: 2 hours each, GS Paper I and CSAT.' }
];

// s: subject, c: class, t: title, k: ncert.nic.in book code ("hess2=0-8"),
// opt: lower priority for prelims, ref: a reference book (add chapters yourself).
window.IAS_BOOKS = [
  /* ---------------- History ---------------- */
  { id: 'h6', s: 'hist', c: '6', t: 'Our Pasts – I', ch: [
    'What, Where, How and When?', 'On the Trail of the Earliest People', 'From Gathering to Growing Food',
    'In the Earliest Cities', 'What Books and Burials Tell Us', 'Kingdoms, Kings and an Early Republic',
    'New Questions and Ideas', 'Ashoka, the Emperor Who Gave Up War', 'Vital Villages, Thriving Towns',
    'Traders, Kings and Pilgrims', 'New Empires and Kingdoms', 'Buildings, Paintings and Books'] },
  { id: 'h7', s: 'hist', c: '7', t: 'Our Pasts – II', ch: [
    'Tracing Changes Through a Thousand Years', 'New Kings and Kingdoms', 'The Delhi Sultans',
    'The Mughal Empire', 'Rulers and Buildings', 'Towns, Traders and Craftspersons',
    'Tribes, Nomads and Settled Communities', 'Devotional Paths to the Divine',
    'The Making of Regional Cultures', 'Eighteenth-Century Political Formations'] },
  { id: 'h8', s: 'hist', c: '8', t: 'Our Pasts – III', k: 'hess2=0-8', ch: [
    'How, When and Where', 'From Trade to Territory: The Company Establishes Power', 'Ruling the Countryside',
    'Tribals, Dikus and the Vision of a Golden Age', 'When People Revolt: 1857 and After',
    'Colonialism and the City: The Story of an Imperial Capital', 'Weavers, Iron Smelters and Factory Owners',
    'Civilising the “Native”, Educating the Nation', 'Women, Caste and Reform',
    'The Changing World of Visual Arts', 'The Making of the National Movement: 1870s–1947',
    'India After Independence'] },
  { id: 'h9', s: 'hist', c: '9', t: 'India and the Contemporary World – I', ch: [
    'The French Revolution', 'Socialism in Europe and the Russian Revolution', 'Nazism and the Rise of Hitler',
    'Forest Society and Colonialism', 'Pastoralists in the Modern World', 'Peasants and Farmers',
    'History and Sport: The Story of Cricket', 'Clothing: A Social History'] },
  { id: 'h10', s: 'hist', c: '10', t: 'India and the Contemporary World – II', k: 'jess3=0-5', ch: [
    'The Rise of Nationalism in Europe', 'The Nationalist Movement in Indo-China', 'Nationalism in India',
    'The Making of a Global World', 'The Age of Industrialisation', 'Work, Life and Leisure',
    'Print Culture and the Modern World', 'Novels, Society and History'] },
  { id: 'h11', s: 'hist', c: '11', t: 'Themes in World History', k: 'kehs1=0-7', opt: 1, ch: [
    'From the Beginning of Time', 'Writing and City Life', 'An Empire Across Three Continents',
    'The Central Islamic Lands', 'Nomadic Empires', 'The Three Orders', 'Changing Cultural Traditions',
    'Confrontation of Cultures', 'The Industrial Revolution', 'Displacing Indigenous Peoples',
    'Paths to Modernisation'] },
  { id: 'h12a', s: 'hist', c: '12', t: 'Themes in Indian History – I', k: 'lehs1=0-4', ch: [
    'Bricks, Beads and Bones: The Harappan Civilisation', 'Kings, Farmers and Towns: Early States and Economies',
    'Kinship, Caste and Class: Early Societies', 'Thinkers, Beliefs and Buildings: Cultural Developments'] },
  { id: 'h12b', s: 'hist', c: '12', t: 'Themes in Indian History – II', k: 'lehs2=0-4', ch: [
    'Through the Eyes of Travellers: Perceptions of Society', 'Bhakti–Sufi Traditions: Changes in Religious Beliefs and Devotional Texts',
    'An Imperial Capital: Vijayanagara', 'Peasants, Zamindars and the State: Agrarian Society and the Mughal Empire',
    'Kings and Chronicles: The Mughal Courts'] },
  { id: 'h12c', s: 'hist', c: '12', t: 'Themes in Indian History – III', k: 'lehs3=0-4', ch: [
    'Colonialism and the Countryside: Exploring Official Archives', 'Rebels and the Raj: The Revolt of 1857 and Its Representations',
    'Colonial Cities: Urbanisation, Planning and Architecture', 'Mahatma Gandhi and the Nationalist Movement: Civil Disobedience and Beyond',
    'Understanding Partition: Politics, Memories, Experiences', 'Framing the Constitution: The Beginning of a New Era'] },
  { id: 'hr1', s: 'hist', ref: 1, t: 'India’s Ancient Past — R.S. Sharma (old NCERT)' },
  { id: 'hr2', s: 'hist', ref: 1, t: 'History of Medieval India — Satish Chandra (old NCERT)' },
  { id: 'hr3', s: 'hist', ref: 1, t: 'A Brief History of Modern India — Spectrum (Rajiv Ahir)' },
  { id: 'hr4', s: 'hist', ref: 1, opt: 1, t: 'India’s Struggle for Independence — Bipan Chandra' },

  /* ---------------- Art & Culture ---------------- */
  { id: 'a11', s: 'art', c: '11', t: 'An Introduction to Indian Art – Part I', k: 'kefa1=0-8', ch: [
    'Prehistoric Rock Paintings', 'Arts of the Indus Valley', 'Arts of the Mauryan Period',
    'Post-Mauryan Trends in Indian Art and Architecture', 'Later Mural Traditions', 'Temple Architecture and Sculpture',
    'Indian Bronze Sculpture', 'Some Aspects of Indo-Islamic Architecture'] },
  { id: 'a12', s: 'art', c: '12', t: 'An Introduction to Indian Art – Part II', k: 'lefa1=0-8', ch: [
    'The Manuscript Painting Tradition', 'The Rajasthani Schools of Painting', 'The Mughal School of Miniature Painting',
    'The Deccani Schools of Painting', 'The Pahari Schools of Painting', 'The Bengal School and Cultural Nationalism',
    'The Modern Indian Art', 'The Living Art Traditions of India'] },
  { id: 'ar1', s: 'art', ref: 1, t: 'Indian Art and Culture — Nitin Singhania' },
  { id: 'ar2', s: 'art', ref: 1, opt: 1, t: 'CCRT material (ccrtindia.gov.in)' },

  /* ---------------- Geography ---------------- */
  { id: 'g6', s: 'geo', c: '6', t: 'The Earth: Our Habitat', ch: [
    'The Earth in the Solar System', 'Globe: Latitudes and Longitudes', 'Motions of the Earth', 'Maps',
    'Major Domains of the Earth', 'Major Landforms of the Earth', 'Our Country – India',
    'India: Climate, Vegetation and Wildlife'] },
  { id: 'g7', s: 'geo', c: '7', t: 'Our Environment', ch: [
    'Environment', 'Inside Our Earth', 'Our Changing Earth', 'Air', 'Water', 'Natural Vegetation and Wildlife',
    'Human Environment – Settlement, Transport and Communication',
    'Human Environment Interactions: The Tropical and the Subtropical Region', 'Life in the Temperate Grasslands',
    'Life in the Deserts'] },
  { id: 'g8', s: 'geo', c: '8', t: 'Resource and Development', k: 'hess4=0-5', ch: [
    'Resources', 'Land, Soil, Water, Natural Vegetation and Wildlife Resources', 'Mineral and Power Resources',
    'Agriculture', 'Industries', 'Human Resources'] },
  { id: 'g9', s: 'geo', c: '9', t: 'Contemporary India – I', ch: [
    'India – Size and Location', 'Physical Features of India', 'Drainage', 'Climate',
    'Natural Vegetation and Wildlife', 'Population'] },
  { id: 'g10', s: 'geo', c: '10', t: 'Contemporary India – II', k: 'jess1=0-7', ch: [
    'Resources and Development', 'Forest and Wildlife Resources', 'Water Resources', 'Agriculture',
    'Minerals and Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy'] },
  { id: 'g11a', s: 'geo', c: '11', t: 'Fundamentals of Physical Geography', k: 'kegy2=0-14', ch: [
    'Geography as a Discipline', 'The Origin and Evolution of the Earth', 'Interior of the Earth',
    'Distribution of Oceans and Continents', 'Minerals and Rocks', 'Geomorphic Processes', 'Landforms and their Evolution',
    'Composition and Structure of Atmosphere', 'Solar Radiation, Heat Balance and Temperature',
    'Atmospheric Circulation and Weather Systems', 'Water in the Atmosphere', 'World Climate and Climate Change',
    'Water (Oceans)', 'Movements of Ocean Water', 'Life on the Earth', 'Biodiversity and Conservation'] },
  { id: 'g11b', s: 'geo', c: '11', t: 'India: Physical Environment', k: 'kegy1=0-6', ch: [
    'India — Location', 'Structure and Physiography', 'Drainage System', 'Climate', 'Natural Vegetation', 'Soils',
    'Natural Hazards and Disasters'] },
  { id: 'g12a', s: 'geo', c: '12', t: 'Fundamentals of Human Geography', k: 'legy1=0-8', ch: [
    'Human Geography: Nature and Scope', 'The World Population: Distribution, Density and Growth', 'Population Composition',
    'Human Development', 'Primary Activities', 'Secondary Activities', 'Tertiary and Quaternary Activities',
    'Transport and Communication', 'International Trade', 'Human Settlements'] },
  { id: 'g12b', s: 'geo', c: '12', t: 'India: People and Economy', k: 'legy2=0-9', ch: [
    'Population: Distribution, Density, Growth and Composition', 'Migration: Types, Causes and Consequences',
    'Human Development', 'Human Settlements', 'Land Resources and Agriculture', 'Water Resources',
    'Mineral and Energy Resources', 'Manufacturing Industries', 'Planning and Sustainable Development in Indian Context',
    'Transport and Communication', 'International Trade', 'Geographical Perspective on Selected Issues and Problems'] },
  { id: 'gr1', s: 'geo', ref: 1, t: 'Certificate Physical and Human Geography — G.C. Leong' },
  { id: 'gr2', s: 'geo', ref: 1, t: 'Oxford Student Atlas for India (map work)' },

  /* ---------------- Polity ---------------- */
  { id: 'p6', s: 'pol', c: '6', t: 'Social and Political Life – I', ch: [
    'Understanding Diversity', 'Diversity and Discrimination', 'What is Government?',
    'Key Elements of a Democratic Government', 'Panchayati Raj', 'Rural Administration', 'Urban Administration',
    'Rural Livelihoods', 'Urban Livelihoods'] },
  { id: 'p7', s: 'pol', c: '7', t: 'Social and Political Life – II', ch: [
    'On Equality', 'Role of the Government in Health', 'How the State Government Works', 'Growing up as Boys and Girls',
    'Women Change the World', 'Understanding Media', 'Understanding Advertising', 'Markets Around Us',
    'A Shirt in the Market', 'Struggles for Equality'] },
  { id: 'p8', s: 'pol', c: '8', t: 'Social and Political Life – III', k: 'hess3=0-8', ch: [
    'The Indian Constitution', 'Understanding Secularism', 'Why Do We Need a Parliament?', 'Understanding Laws',
    'Judiciary', 'Understanding Our Criminal Justice System', 'Understanding Marginalisation',
    'Confronting Marginalisation', 'Public Facilities', 'Law and Social Justice'] },
  { id: 'p9', s: 'pol', c: '9', t: 'Democratic Politics – I', ch: [
    'Democracy in the Contemporary World', 'What is Democracy? Why Democracy?', 'Constitutional Design',
    'Electoral Politics', 'Working of Institutions', 'Democratic Rights'] },
  { id: 'p10', s: 'pol', c: '10', t: 'Democratic Politics – II', k: 'jess4=0-5', ch: [
    'Power-sharing', 'Federalism', 'Democracy and Diversity', 'Gender, Religion and Caste',
    'Popular Struggles and Movements', 'Political Parties', 'Outcomes of Democracy', 'Challenges to Democracy'] },
  { id: 'p11a', s: 'pol', c: '11', t: 'Indian Constitution at Work', k: 'keps2=0-10', ch: [
    'Constitution: Why and How?', 'Rights in the Indian Constitution', 'Election and Representation', 'Executive',
    'Legislature', 'Judiciary', 'Federalism', 'Local Governments', 'Constitution as a Living Document',
    'The Philosophy of the Constitution'] },
  { id: 'p11b', s: 'pol', c: '11', t: 'Political Theory', k: 'keps1=0-8', opt: 1, ch: [
    'Political Theory: An Introduction', 'Freedom', 'Equality', 'Social Justice', 'Rights', 'Citizenship',
    'Nationalism', 'Secularism', 'Peace', 'Development'] },
  { id: 'p12a', s: 'pol', c: '12', t: 'Politics in India since Independence', k: 'leps2=0-8', ch: [
    'Challenges of Nation Building', 'Era of One-party Dominance', 'Politics of Planned Development',
    'India’s External Relations', 'Challenges to and Restoration of the Congress System',
    'The Crisis of Democratic Order', 'Rise of Popular Movements', 'Regional Aspirations',
    'Recent Developments in Indian Politics'] },
  { id: 'p12b', s: 'pol', c: '12', t: 'Contemporary World Politics', k: 'leps1=0-7', ch: [
    'The Cold War Era', 'The End of Bipolarity', 'US Hegemony in World Politics', 'Alternative Centres of Power',
    'Contemporary South Asia', 'International Organisations', 'Security in the Contemporary World',
    'Environment and Natural Resources', 'Globalisation'] },
  { id: 'pr1', s: 'pol', ref: 1, t: 'Indian Polity — M. Laxmikanth' },
  { id: 'pr2', s: 'pol', ref: 1, opt: 1, t: 'The Constitution of India — bare text (legislative.gov.in)' },

  /* ---------------- Economy ---------------- */
  { id: 'e9', s: 'eco', c: '9', t: 'Economics', ch: [
    'The Story of Village Palampur', 'People as Resource', 'Poverty as a Challenge', 'Food Security in India'] },
  { id: 'e10', s: 'eco', c: '10', t: 'Understanding Economic Development', k: 'jess2=0-5', ch: [
    'Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation and the Indian Economy',
    'Consumer Rights'] },
  { id: 'e11', s: 'eco', c: '11', t: 'Indian Economic Development', k: 'keec1=0-8', ch: [
    'Indian Economy on the Eve of Independence', 'Indian Economy 1950–1990',
    'Liberalisation, Privatisation and Globalisation: An Appraisal', 'Poverty', 'Human Capital Formation in India',
    'Rural Development', 'Employment: Growth, Informalisation and Other Issues', 'Infrastructure',
    'Environment and Sustainable Development', 'Comparative Development Experiences of India and its Neighbours'] },
  { id: 'e12a', s: 'eco', c: '12', t: 'Introductory Macroeconomics', k: 'leec1=0-6', ch: [
    'Introduction', 'National Income Accounting', 'Money and Banking', 'Determination of Income and Employment',
    'Government Budget and the Economy', 'Open Economy Macroeconomics'] },
  { id: 'e12b', s: 'eco', c: '12', t: 'Introductory Microeconomics', k: 'leec2=0-5', opt: 1, ch: [
    'Introduction', 'Theory of Consumer Behaviour', 'Production and Costs',
    'The Theory of the Firm under Perfect Competition', 'Market Equilibrium', 'Non-competitive Markets'] },
  { id: 'er1', s: 'eco', ref: 1, t: 'Indian Economy — Ramesh Singh' },
  { id: 'er2', s: 'eco', ref: 1, t: 'Economic Survey (latest) — summary chapters' },
  { id: 'er3', s: 'eco', ref: 1, t: 'Union Budget (latest) — key announcements' },

  /* ---------------- Environment ---------------- */
  { id: 'v12', s: 'env', c: '12', t: 'Biology — Ecology unit', k: 'lebo1=0-13', ch: [
    'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation', 'Environmental Issues'] },
  { id: 'vr1', s: 'env', ref: 1, t: 'Environment — Shankar IAS Academy' },

  /* ---------------- Science & Tech ---------------- */
  { id: 's6', s: 'sci', c: '6', t: 'Science', ch: [
    'Food: Where Does It Come From?', 'Components of Food', 'Fibre to Fabric', 'Sorting Materials into Groups',
    'Separation of Substances', 'Changes Around Us', 'Getting to Know Plants', 'Body Movements',
    'The Living Organisms and Their Surroundings', 'Motion and Measurement of Distances',
    'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Water', 'Air Around Us',
    'Garbage In, Garbage Out'] },
  { id: 's7', s: 'sci', c: '7', t: 'Science', ch: [
    'Nutrition in Plants', 'Nutrition in Animals', 'Fibre to Fabric', 'Heat', 'Acids, Bases and Salts',
    'Physical and Chemical Changes', 'Weather, Climate and Adaptations of Animals to Climate',
    'Winds, Storms and Cyclones', 'Soil', 'Respiration in Organisms', 'Transportation in Animals and Plants',
    'Reproduction in Plants', 'Motion and Time', 'Electric Current and its Effects', 'Light',
    'Water: A Precious Resource', 'Forests: Our Lifeline', 'Wastewater Story'] },
  { id: 's8', s: 'sci', c: '8', t: 'Science', k: 'hesc1=0-13', ch: [
    'Crop Production and Management', 'Microorganisms: Friend and Foe', 'Synthetic Fibres and Plastics',
    'Materials: Metals and Non-Metals', 'Coal and Petroleum', 'Combustion and Flame',
    'Conservation of Plants and Animals', 'Cell — Structure and Functions', 'Reproduction in Animals',
    'Reaching the Age of Adolescence', 'Force and Pressure', 'Friction', 'Sound',
    'Chemical Effects of Electric Current', 'Some Natural Phenomena', 'Light', 'Stars and the Solar System',
    'Pollution of Air and Water'] },
  { id: 's9', s: 'sci', c: '9', t: 'Science', ch: [
    'Matter in Our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom',
    'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion',
    'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill?', 'Natural Resources',
    'Improvement in Food Resources'] },
  { id: 's10', s: 'sci', c: '10', t: 'Science', k: 'jesc1=0-13', ch: [
    'Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds',
    'Periodic Classification of Elements', 'Life Processes', 'Control and Coordination',
    'How do Organisms Reproduce?', 'Heredity and Evolution', 'Light – Reflection and Refraction',
    'The Human Eye and the Colourful World', 'Electricity', 'Magnetic Effects of Electric Current',
    'Sources of Energy', 'Our Environment', 'Sustainable Management of Natural Resources'] },
  { id: 's11', s: 'sci', c: '11', t: 'Biology — selected chapters', k: 'kebo1=0-19', opt: 1, ch: [
    'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Breathing and Exchange of Gases',
    'Body Fluids and Circulation', 'Excretory Products and their Elimination', 'Neural Control and Coordination',
    'Chemical Coordination and Integration'] },
  { id: 's12', s: 'sci', c: '12', t: 'Biology — selected chapters', k: 'lebo1=0-13', ch: [
    'Reproductive Health', 'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution',
    'Human Health and Disease', 'Microbes in Human Welfare', 'Biotechnology: Principles and Processes',
    'Biotechnology and its Applications'] },

  /* ---------------- Current affairs ---------------- */
  { id: 'ca', s: 'ca', t: 'Sources to follow', ch: [
    'Daily newspaper — The Hindu or The Indian Express', 'PIB (pib.gov.in) — government releases',
    'Yojana (monthly)', 'Kurukshetra (monthly)', 'Down To Earth (environment)', 'Monthly current-affairs compilation',
    'India Year Book (latest)', 'Government schemes list', 'International organisations and reports',
    'Places in news (maps)'] },

  /* ---------------- CSAT ---------------- */
  { id: 'cs', s: 'csat', t: 'Paper II syllabus', ch: [
    'Comprehension', 'Interpersonal skills including communication skills', 'Logical reasoning and analytical ability',
    'Decision making and problem solving', 'General mental ability',
    'Basic numeracy (numbers and their relations, orders of magnitude) — Class X level',
    'Data interpretation (charts, graphs, tables, data sufficiency) — Class X level'] },

  /* ---------------- Past papers ---------------- */
  { id: 'py1', s: 'pyq', t: 'GS Paper I — previous years', ch: [
    '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013'] },
  { id: 'py2', s: 'pyq', t: 'CSAT (Paper II) — previous years', ch: [
    '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013'] }
];
