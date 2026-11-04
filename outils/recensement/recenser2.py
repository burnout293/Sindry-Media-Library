"""Second pass: standard freedesktop names that no installed theme has (so the first pass could not
see them), looked up in the same binaries; then which apps of the system are visible in a menu."""
import os
import re

BS = chr(92)
STANDARD = """
dialog-information dialog-warning dialog-error dialog-question dialog-password
emblem-ok emblem-default emblem-important emblem-synchronizing emblem-system emblem-new
network-wired network-wireless network-offline network-error network-idle network-transmit network-receive
network-server network-workgroup
battery battery-caution battery-empty battery-low battery-good battery-full battery-missing battery-full-charging
battery-good-charging battery-low-charging battery-caution-charging battery-empty-charging battery-full-charged
audio-volume-high audio-volume-medium audio-volume-low audio-volume-muted audio-headphones audio-speakers audio-card
audio-input-microphone audio-x-generic video-x-generic image-x-generic text-x-generic text-x-script text-html
application-x-executable application-x-generic package-x-generic x-office-document x-office-spreadsheet
x-office-presentation font-x-generic unknown application-pdf
system-shutdown system-reboot system-log-out system-lock-screen system-suspend system-hibernate system-switch-user
system-software-install system-software-update software-update-available software-update-urgent
system-run system-search system-help help-browser help-contents help-about help-faq
preferences-system preferences-desktop preferences-other preferences-desktop-wallpaper preferences-desktop-theme
preferences-desktop-display preferences-desktop-keyboard preferences-desktop-locale preferences-desktop-accessibility
preferences-system-time preferences-system-network applications-system applications-accessories
applications-internet applications-multimedia applications-graphics applications-office applications-games
applications-development applications-utilities applications-other applications-science applications-education
utilities-terminal utilities-system-monitor utilities-file-archiver accessories-text-editor accessories-calculator
accessories-screenshot web-browser multimedia-volume-control system-file-manager
start-here computer user-home user-desktop user-trash user-trash-full user-available user-away user-offline
folder folder-open folder-documents folder-download folder-music folder-pictures folder-videos folder-remote
drive-harddisk drive-optical drive-removable-media drive-removable-media-usb media-optical media-flash
media-removable media-floppy media-tape input-keyboard input-mouse input-gaming input-tablet video-display
printer scanner camera-photo camera-video camera-web phone modem multimedia-player pda computer-laptop
security-high security-medium security-low appointment-soon appointment-missed mail-unread
image-loading image-missing document-open-recent notification-message-im
""".split()
token = re.compile(rb'[a-zA-Z][a-zA-Z0-9._-]{3,60}')
want = set(STANDARD)
found = {}
skip = re.compile(r'firefox|vlc|libav|libx26|libgtk-4|libQt|libicu|libcrypto|libssl|libgs|libmesa|libdrm|libvpx|flite|zbar|python3|webkit|javascript')
for base, _, files in os.walk(os.path.join('root', 'usr')):
    if '/share/' in base.replace(BS, '/'):
        continue
    for f in files:
        path = os.path.join(base, f)
        if os.path.islink(path) or skip.search(f):
            continue
        try:
            size = os.path.getsize(path)
            if size < 512 or size > 80_000_000:
                continue
            data = open(path, 'rb').read()
        except OSError:
            continue
        for t in set(token.findall(data)):
            s = t.decode('ascii')
            if s in want:
                found.setdefault(s, set()).add(f)
import json
json.dump({k: sorted(v) for k, v in found.items()}, open('standards.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('noms standard cités :', len(found), 'sur', len(want))
for k in sorted(found):
    print(' ', k, '<-', ', '.join(sorted(found[k]))[:70])
print()
print('Entrées visibles dans un menu (ni NoDisplay, ni Hidden) :')
for base, _, files in os.walk(os.path.join('root', 'usr', 'share', 'applications')):
    for f in sorted(files):
        if not f.endswith('.desktop'):
            continue
        text = open(os.path.join(base, f), encoding='utf-8', errors='replace').read()
        if re.search(r'^(NoDisplay|Hidden)=true', text, re.M):
            continue
        icon = re.search(r'^Icon=(.+)$', text, re.M)
        name = re.search(r'^Name=(.+)$', text, re.M)
        print('  %-44s %-38s %s' % (f, icon.group(1) if icon else '-', name.group(1) if name else ''))
print()
names = sorted(os.listdir(os.path.join('root', 'usr', 'bin')))
for probe in ('xfce4-notifyd', 'xfce4-screenshooter', 'xfce4-taskmanager', 'xarchiver', 'galculator', 'pavucontrol', 'blueman-manager', 'xfce4-power-manager', 'thunar-volman', 'nm-applet'):
    print(' ', probe, probe in names or os.path.exists(os.path.join('root', 'usr', 'lib', 'xfce4', 'notifyd', probe)))
