async function promtProcessor(email) {

    const prompt = `
    Given the following email content, extract the following fields in JSON & RESPOND ONLY FINAL ANSWER:
    - Threat Campaign
    - Severity of Threat (High, Medium, Low, Urgent) adjust for nuance
    - Suspected IPs of Threat
    the JSON format should be :
    - campaign
    - type
    - suspect_ip
    Email:
    ${email}
    `;

    const API = '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';
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "model": "microsoft/phi-4-reasoning:free",
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        })
    });

    const jsonResponse = await response.json();
    const result =  jsonResponse.choices[0].message.content;

    const matches = [...result.matchAll(/{[\s\S]*?}/g)];


    if (matches.length > 0) {
    // Get the last JSON-like block
    let lastJsonLike = matches[matches.length - 1][0];

    // Fix format to valid JSON
    lastJsonLike = lastJsonLike.replace(/(\w+)\s*:\s*([^,\n}]+)/g, (m, key, value) => {
        key = `"${key.trim()}"`;
        value = `"${value.trim()}"`;
        return `${key}: ${value}`;
    });

    let parsed;

    try {
        parsed = JSON.parse(lastJsonLike);
        console.log(parsed);
        return parsed;
    } catch (e) {
        console.error("Failed to parse JSON:", e);
        return e;
    }
    } else {
    console.log("No JSON-like structure found.");
    return "Error"
}
}

promtProcessor(`mail is good
Inbox

Mayank Agarwal <mayankagwl1@gmail.com>
3:30 PM (14 minutes ago)
to me

Email Amarjyoti
Fw: [CMTX-P-052025015] SHADOWPAD (POISONPLUG) Malware Campaign –
Immediate Action Required
From : cert thermal <cert_thermal@ntpc.co.in>
Subject : Fw: [CMTX-P-052025015] SHADOWPAD
(POISONPLUG) Malware Campaign – Immediate
Action Required
To : AKMEENA@NTPC.CO.IN,
ARUNKRSHARMA@NTPC.CO.IN, hoditjv@ntpc.co.in,
MKRATHI@NTPC.CO.IN,
MANOJBASWAL@NTPC.CO.IN,
RKVAISHYA@NTPC.CO.IN,
RAJIVSALWAN@NTPC.CO.IN,
ASHISHJAIN04@NTPC.CO.IN,
SHARADSINGH@NTPC.CO.IN, soc@ntpc.co.in,
aanandverma av <aanandverma.av@gmail.com>,
ajay munda <ajay.munda@tvnl.in>, alt ciso
<alt_ciso@rrvun.com>, CISO BTPS
<altciso.nlcil@nlcindia.in>, Amarjyoti
<amarjyotib@neepco.co.in>, amit panchalwar
<amit.panchalwar@rattanindia.com>, Amit Kumar
Singh <amit.singh@dvc.gov.in>, amit verma
<amit.verma@gmrgroup.in>, anal chakravorty
<anal.chakravorty@gvk.com>, analjyoti chakravorty
<analjyoti.chakravorty@gatp.in>, anand verma
<anand.verma@mppgcl.mp.gov.in>, anilkumar hnp
<anilkumar.hnp@hindujagroup.com>, ar rakshit
<ar.rakshit@wbpdcl.co.in>, arun pradhan
<arun.pradhan@opgc.co.in>, ashish mishra
<ashish.mishra@relianceada.com>, ashish patil
<ashish.patil@adani.com>, ashish raj
<ashish.raj@lancogroup.com>, avinashkeshry ltp
<avinashkeshry.ltp@lpgcl.com>, baliram jadhav
<baliram.jadhav@rattanindia.com>, basan gouda
<basan.gouda@jsw.in>, bashant prakash
<bashant.prakash@site.rgppl.com>,
basis@tggenco.com, bithal bhardwaj
<bithal.bhardwaj@gmrgroup.in>, brajesh
vishwakarma
<brajesh.vishwakarma@jhabuapower.co.in>,
ceit@tnebnet.org, cepc@tnebnet.org, cgm-
adm@apgenco.gov.in, cgmerp@tsgenco.co.in,
ciso@tatapower.com, ciso@apgenco.gov.in, ciso
cspgcl <ciso.cspgcl@cspc.co.in>, ciso guvnl
<ciso.guvnl@gebmail.com>, CISO NLCIL
<ciso.nlcil@nlcindia.in>, ciso@mahagenco.in,
ciso@rrvun.com, ciso@site.rgppl.com, ciso@tvnl.in,
ciso@tsgenco.co.in, corporateit@gipcl.com,
cscell@kseb.in, csrt@cspc.co.in, cyber advisories
Mon, May 05, 2025 04:59 PM<cyber.advisories@adani.com>,
DRSARMA@NTPC.CO.IN, dceit@kseb.in,
dgmit@mahagenco.in, dheeraj sinha
<dheeraj.sinha@jsw.in>, diso@avanthapower.com,
dnvishwakarma@nspcl.co.in, durgesh gupta
<durgesh.gupta@lancogroup.com>, E IN Apraava cst
<E_IN_Apraava_cst@apraava.com>,
edit@mahagenco.in,
eesystemskpcl@karnataka.gov.in,
eSecure@essar.com, firoz khan
<firoz.khan@lancogroup.com>, ganesh vj
<ganesh.vj@rkm.in>, Gaurang Doshi
<Gaurang.Doshi@essar.com>,
gmerp@apgenco.gov.in, gmit ho
<gmit.ho@mahagenco.in>,
gobardhan@jindalpower.com, gs santra
<gs.santra@dbpower.in>, gtramu@gvk.com, hemen
b <hemen.b@gspc.in>, HKVERMA02@NTPC.CO.IN,
Hitendra Kumar Sharma <hitendra@neepco.co.in>,
hodit cc <hodit.cc@nspcl.co.in>,
IBMBABU@NTPC.CO.IN, imran qureshi
<imran.qureshi@relianceada.com>, india soc
<india.soc@sembcorp.com>, info@gmrgroup.in,
isd@apgenco.gov.in, Sunil Gagneja
<it@hpgcl.org.in>, it plant <it.plant@rkm.in>, it
security <it.security@jsw.in>, it@rkm.in,
itsecurity@opgc.co.in, itsupport amravati
<itsupport_amravati@rattanindia.com>, jai shankar
<jai.shankar@rattanindia.com>, jd barma
<jd.barma@otpcindia.in>, jitesh patel
<jitesh.patel@sembcorp.com>, Joji Joseph
<Joji.Joseph@relianceada.com>, J.P. CHAURASIYA
ADDL GENERAL MANAGER
<jpchaurasiya.ipgpp@nic.in>, jpco gsecl
<jpco.gsecl@gebmail.com>, Kailas Thakur
<Kailas.Thakur@relianceada.com>,
kakuprasad@gspc.in, kalpnath verma
<kalpnath.verma@uprvunl.org>, kamlesh joshi2
<kamlesh.joshi2@essarpower.co.in>, kapil kachhiya
<kapil.kachhiya@clpindia.in>, kaushal@gspc.in,
Khelen Singh Sr Mgr IT AGBP
<khelen@neepco.co.in>, kumar rajeev
<kumar.rajeev@lancogroup.com>, kvss gupta
<kvss.gupta@nspcl.co.in>, Sanjeev Kumar Soni,
CISO <mail.ciso@ipgcl-ppcl.nic.in>,
manikandan@sepc.in.net, manindra nath
<manindra.nath@uprvunl.org>, manjeet sahay
<manjeet.sahay@tvnl.in>, Manowar Ismail
<manowar.ismail@dvc.gov.in>, mathews michael
<mathews.michael@site.rgppl.com>, Mayaprakash
Pandey <Mayaprakash.Pandey@adani.com>,
MICHAELMATHEWS@NTPC.CO.IN, MinketanPrasad
Naik <MinketanPrasad.Naik@cspc.co.in>, narayan g
<narayan.g@gvk.com>, nbhardwaj@gspc.in, nitish k
<nitish.k@tvnl.in>, pallab ganguly<pallab.ganguly@rpsg.in>,
pareshgoswami@torrentpower.com, pintu singh
<pintu.singh@jindalpower.com>,
PRDEBBARMA@NTPC.CO.IN, prajwal mandlik
<prajwal.mandlik@rattanindia.com>, pramod kumar
<pramod.kumar@otpcindia.in>,
pranjantvnl@gmail.com, prashanttripathi@nspcl.co.in,
prince ranjan <prince.ranjan@tvnl.in>, r arvind
<r.arvind@cspc.co.in>, RKSINGH01@NTPC.CO.IN,
Rahul Sankalpa <Rahul.Sankalpa@relianceada.com>,
rajaroy@gvk.com, RAJESHSAHOO@NTPC.CO.IN,
rajivsharaf@torrentpower.com, rajnish saroha
<rajnish.saroha@apraava.com>, RAMESHWAR
SOLANKI <rameshwar.solanki@mppgcl.mp.gov.in>,
rameshwarsolanki85@gmail.com, Ravi Ranjan Kumar
, EE IT <ravi.kumar@dvc.gov.in>,
ravikpc@gmail.com, ravit@gspc.in,
RISHIPAL@NTPC.CO.IN, rk jena
<rk.jena@nspcl.co.in>, rohan pathivada
<rohan.pathivada@apraava.com>, rohit hnp
<rohit.hnp@hindujagroup.com>, rohit rajvanshi
<rohit.rajvanshi@avanthapower.com>, rohit sharma1
<rohit.sharma1@adani.com>, rv vivek
<rv.vivek@site.rgppl.com>,
sa2mumbai@mahagenco.in, salil singh
<salil.singh@adani.com>,
samirmohanty@jindalpower.com, sandeep mishra
<sandeep.mishra@lancogroup.com>, sanjay m
<sanjay.m@gspc.in>, sanjeev kumar
<sanjeev.kumar@nspcl.co.in>, Sanjiv Arora
<sanjiv.arora@mppgcl.mp.gov.in>,
sanjivarora2003@gmail.com,
sanjivarora2003@yahoo.com, saylee tawde
<saylee.tawde@apraava.com>, se-ci-lehra@pspcl.in,
sesystemskpcl@karnataka.gov.in, shabbir badra
<shabbir.badra@apraava.com>,
shahnirav@torrentpower.com, shanmukharao t
<shanmukharao.t@rkm.in>, sharad mishra
<sharad.mishra@relianceada.com>, sjoshi@gspc.in,
somendra prusti <somendra.prusti@nspcl.co.in>, sr
singh <sr.singh@tvnl.in>, subbu pulakam
<subbu.pulakam@lancogroup.com>, subhranshum
ltp <subhranshum.ltp@lpgcl.com>, Sukhdeep Singh
<Sukhdeep.Singh@gvk.com>, sukhdeep singh
<sukhdeep.singh@gatp.in>,
SURAVEETRIPATHY@NTPC.CO.IN, suravee tripathy
<suravee.tripathy@nspcl.co.in>,
svprabhu@tatapower.com, sysana gsecl
<sysana.gsecl@gebmail.com>, tasneem sayed
<tasneem.sayed@apraava.com>,
CISO@torrentpower.com, ukaisys@gebmail.com, uma
rao <uma.rao@lancogroup.com>, Umesh Dubey
<Umesh.Dubey@relianceada.com>, upendra paswan
<upendra.paswan@rkm.in>, usman kathi
<usman.kathi@jsw.in>, v sharma<v.sharma@cspc.co.in>, vijay ghodke
<vijay.ghodke@rattanindia.com>, vinod am
<vinod.am@meilgroup.org>, vinod m
<vinod.m@rattanindia.com>, virendra sharma
<virendra.sharma@jindalpower.com>, viswanathan
saranathan <viswanathan.saranathan@rkm.in>,
VIVEK RASTOGI <vivek.rastogi@dvc.gov.in>, vk sai
<vk.sai@cspc.co.in>, VIMLENDU KUMAR DY
GENERAL MANAGER <vkumar.ipgpp@nic.in>,
VIVEKRVEERAVAGU@NTPC.CO.IN, xen-inventory-
ghtp@pspcl.in, H. K. Kansal
<xenit.dcrtpp@hpgcl.org.in>, Rajni Rani
<xenit.ptps@hpgcl.org.in>, yogendra khaire
<yogendra.khaire@adani.com>, krishnendu de
<krishnendu.de@rpsg.in>, ciso@dvc.gov.in, Pankaj
mukane <Pankaj.mukane@seilenergy.com>,
ALOKKUMARSINHA@NTPC.CO.IN,
ANKURTRIPATHY@NTPC.CO.IN,
BSJENA@NTPC.CO.IN, AJAYAPRAKASH@NTPC.CO.IN,
JITENDRASINGH@NTPC.CO.IN,
KCHANDRAMOULI@NTPC.CO.IN,
KULDEEP01@NTPC.CO.IN,
MSREEKANTH@NTPC.CO.IN,
PKGUPTA06@NTPC.CO.IN,
RAMESHCHANDRA01@NTPC.CO.IN,
SACHINGARG01@NTPC.CO.IN,
SKPALAVALASA@NTPC.CO.IN
आदरणीय महोदय/महोदया Respected Sir/ Madam,
The Cyber Security Advisory from CERT-In is being forwarded for Necessary Action at your end as per the
advisory.
Compliance to be ensured for the same.
अिधक जानकारी क े िलए क ृ पया हमसे संपक  कर  ।
सादर,
Regards.
-------
A K Patel
महाप्रबंधक (सू.प्रौ.) GM (IT-Commn)
CERT-Thermal (NTPC Ltd)
0120-2410262, 9650997022
From: CMTX-Alerts CERT-In <cmtx.certin@meity.gov.in>
Sent: 05 May 2025 11:11To: alert reply <alert
_
reply@cert-in.org.in>
Subject: [CMTX-P-052025015] SHADOWPAD (POISONPLUG) Malware Campaign – Immediate Action
Required
CAUTION: This Email has been sent from outside the Organization. Unless you trust the sender, Don’t click links or open
attachments as it may be a Phishing email, which can steal your Information and compromise your Computer.
-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA256
[CMTX-P-052025015] SHADOWPAD (POISONPLUG) Malware Campaign – Immediate Action
Required
•(TLP:CLEAR- Recipients can spread this to the world, there is no limit on disclosure i.e
information may be shared without restriction.)
Threat Overview
1. Threat Campaign: SHADOWPAD (POISONPLUG) Malware Campaign
ShadowPad is a sophisticated malware family that continues to be actively used by threat
actors for espionage purposes. Its ability to evade detection and maintain persistence makes it
a significant threat to targeted organizations. It is a modular cyber-attack tool used by Chinese
linked APT groups (APT41/Barium, APT10/Stone Panda, TONTO Team, APT27/Emissary Panda,
APT15, Winnti Group, REDECHO).
The malware has plug-in capabilities along with some other capabilities like self-
destruction,can persist registry entries or services, and forward network connections. Social
media sites have been used by POISONPLUG to host encoded command and control (C&C)
orders.
It is designed to run in two stages; The first stage is a shellcode and second stage acts as an
orchestrator for modules responsible for C&C communication, working with the DNS protocol,
loading and injecting additional plugins into the memory of other processes.
Impacts:
Data Theft and exfiltration : It can steal sensitive information, including personal data, financial
records, and intellectual property, leading to potential identity theft or financial loss.
System Compromise: The malware can gain unauthorized access to systems, allowing
attackers to manipulate or damage files, disrupt operations, and compromise system integrity.
Espionage: It can be used for spying on individuals or organizations, gathering confidential
information, and conducting surveillance without the victim’s knowledge.
2. Threat Type : Multi modular backdoor
3. Severity: High
Distribution Methods:
• Shadow Pad is often delivered through DLL sideloading techniques and exploits vulnerabilities
in software such as Microsoft Office IME binary or Microsoft Exchange Server. It can also been
distributed through supply-chain attacks
Mitigation and Recommendations :
1. Patch Management: Regularly update and patch all software, operating systems, and
applications to close vulnerabilities that malware could exploit.
2. Endpoint Protection: Utilize robust endpoint protection solutions, including antivirus and
anti-malware tools, to detect and block known threats.
3. Network Segmentation: Divide your network into segments to limit the spread of malware.
Ensure that critical systems and sensitive data are isolated from less secure network areas.4. Access Controls: Implement strict access controls and adhere to the principle of least
privilege, ensuring that users and systems have only the permissions they need.
5. Regular Backups: Maintain regular, secure backups of critical data and systems. Store
backups offline or in a manner that prevents network access.
6. Security Awareness Training: Educate employees on cybersecurity best practices, including
how to recognize phishing attempts and handle suspicious emails or attachments.
7. Intrusion Detection and Prevention: Implement intrusion detection and prevention systems
(IDPS) to monitor network traffic and identify unusual or malicious activities.
8. Application Whitelisting: Use application whitelisting to ensure only approved applications
can run on your systems, blocking unauthorized or potentially harmful software.
...

[Message clipped]  View entire message
`)

