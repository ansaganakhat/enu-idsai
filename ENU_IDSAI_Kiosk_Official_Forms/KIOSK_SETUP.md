# ENU · IDSAI Kiosk deployment

## Quick start

1. Extract the project folder to the kiosk PC.
2. Run `launch-kiosk.bat`.
3. Press **БАСТАУ / НАЧАТЬ** on the branded start screen.
4. The web application requests browser fullscreen; Edge itself is also started in kiosk/fullscreen mode.

## Why Edge Kiosk Mode is included

A normal HTML/JavaScript page cannot block Windows system shortcuts such as `Ctrl+Alt+Delete`, the Windows key, Task Manager, or guarantee fullscreen after navigating to another domain. The included launcher starts Microsoft Edge with its kiosk flag, so ENU and Platonus navigation remains inside the fullscreen browser shell.

For a real unattended public terminal, configure **Windows Assigned Access / Kiosk** for the dedicated kiosk account in addition to this launcher. This is the OS-level layer that prevents access to the desktop and other applications.

## Site exit

Inside the ENU IDSAI application, the **СЕАНСТЫ АЯҚТАУ / ЗАВЕРШИТЬ СЕАНС** action is protected by the admin password configured in `app.js`:

`admin01`

Change `CONFIG.adminPassword` before production if required.

## Printing

The site prints the form at real A4 dimensions and does not use the old automatic CSS scale-down. The supplied DOCX source documents predominantly use Times New Roman 14 pt and A4 margins; the web print styles follow those dimensions. Student bypass sheet is configured as A4 landscape.

In the printer driver, use **A4** and **Actual size / 100%** where available.
