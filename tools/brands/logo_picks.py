"""Which downloaded candidate became each logo in assets/logos/, chosen by
eye from the candidates fetch_logos.py saved: 'site' (the organisation's
own app icon), 'wiki' (its Wikipedia infobox logo), 'si' (Simple Icons, in
the brand's colour), 'file:cm/...' (a sharper file from Wikimedia
Commons, found by commons_logos.py), 'same:<slug>' (reuse another org's logo, e.g. Tata
companies share the Tata mark) or 'file:<name>' (a file fetched by hand).
Organisations missing here had no usable logo (only photos of buildings);
they keep a lettered tile or the plain icon.
"""

PICKS = {
    'accenture': 'si', 'acko': 'wiki', 'adani': 'site', 'airindia': 'si', 'airindiaexpress': 'site', 'akasa': 'site',
    'amrita': 'site', 'angelone': 'site', 'annauniv': 'site', 'aws': 'site', 'azure': 'wiki', 'bajajauto': 'wiki',
    'bajajgeneral': 'site', 'bajajhousing': 'site', 'bharathiar': 'file:cm/bharathiar.c1.jpg', 'blinkit': 'wiki', 'boat': 'si', 'bumble': 'wiki',
    'calicut': 'site', 'canarabank': 'site', 'canva': 'site', 'capgemini': 'site', 'cbse': 'wiki', 'cdsl': 'wiki',
    'chatgpt': 'site', 'cisce': 'wiki', 'cisco': 'wiki', 'cognizant': 'site', 'comptia': 'site', 'coursera': 'site',
    'cred': 'site', 'cusat': 'wiki', 'decathlon': 'site', 'deloitte': 'site', 'digilocker': 'site', 'digit': 'site',
    'eccouncil': 'site', 'eci': 'wiki', 'epfo': 'wiki', 'ey': 'wiki', 'flipkart': 'site', 'groww': 'site',
    'hackthebox': 'site', 'hcltech': 'site', 'hdbfinancial': 'site', 'hdfcergo': 'site', 'hdfclife': 'wiki',
    'heroku': 'site', 'heromotocorp': 'file:cm/heromotocorp.c2.svg', 'hyundaiindia': 'site', 'iaf': 'site', 'ibps': 'wiki', 'ignou': 'wiki',
    'iimk': 'wiki', 'incometax': 'wiki', 'indianarmy': 'wiki', 'indiannavy': 'wiki', 'indiapost': 'file:cm/indiapost.c1.jpg', 'indigo': 'si',
    'infosys': 'si', 'irctc': 'wiki', 'isc2': 'file:cm/isc2.c1.svg', 'isro': 'wiki', 'itc': 'wiki', 'jiofinancial': 'wiki',
    'jiohotstar': 'site', 'jioplatforms': 'wiki', 'kannur': 'site', 'keralagraminbank': 'site',
    'keralapsc': 'site', 'keralauniversity': 'wiki', 'kfintech': 'site', 'kochimetro': 'wiki', 'kotak': 'site',
    'kseb': 'site', 'ksrtc': 'site', 'ktu': 'wiki', 'larsen': 'file:cm/larsen.c1.svg', 'lenskart': 'site', 'lgindia': 'si', 'lic': 'site',
    'linkedin': 'wiki', 'linkintime': 'site', 'madras': 'site', 'manipal': 'wiki', 'marutisuzuki': 'si',
    'maxlife': 'site', 'meesho': 'wiki', 'mgu': 'site', 'microsoft': 'site', 'morth': 'same:upsc', 'myntra': 'site',
    'naukri': 'site', 'newindia': 'file:cm/newindia.c1.svg', 'nitc': 'site', 'nptel': 'site', 'nsdl': 'wiki', 'nta': 'site', 'ntpc': 'wiki',
    'ntpcgreen': 'site', 'nykaa': 'wiki', 'offsec': 'site', 'ola': 'site', 'olaelectric': 'site', 'oracle': 'site',
    'outlook': 'wiki', 'parivahan': 'same:upsc', 'passportseva': 'same:upsc', 'pearsonvue': 'si', 'physicswallah': 'site',
    'primevideo': 'site', 'rapido': 'site', 'rbi': 'wiki', 'redhat': 'site', 'reliance': 'site', 'royalenfield': 'site',
    'rrb': 'wiki', 'sbi': 'file:cm/sbistate.c2.svg', 'sbigeneral': 'same:sbi', 'sbilife': 'site', 'sebi': 'site', 'slack': 'site',
    'ssc': 'site', 'tata': 'site', 'tataaig': 'file:cm/tataaig.c1.png', 'tatacapital': 'wiki', 'tatamotors': 'same:tata', 'tatasteel': 'same:tata',
    'tatatech': 'same:tata', 'tcs': 'si', 'techmahindra': 'site', 'truecaller': 'site', 'tryhackme': 'site',
    'tvsmotor': 'site', 'udemy': 'si', 'uidai': 'site', 'unitedindia': 'wiki', 'upsc': 'file:emblem.svg', 'upstox': 'site',
    'urbancompany': 'site', 'ust': 'site', 'vi': 'site', 'vishalmegamart': 'site', 'vit': 'site', 'waaree': 'site',
    'wipro': 'file:cm/wipro.c1.svg', 'xbox': 'site', 'yahoo': 'site', 'zepto': 'wiki',
}
