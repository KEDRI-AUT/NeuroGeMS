# NeuroGeMS: Neuro-Genetic Multimodal System

[![License](https://img.shields.io/badge/license-AGPL%20v3-blue?style=for-the-badge)](https://github.com/KEDRI-AUT/NeuroGeMS/blob/main/LICENSE)

> A comprehensive software platform for multimodal learning and biomedical research, developed by the Knowledge Engineering and Discovery Research Institute (KEDRI) at Auckland University of Technology (AUT), New Zealand.

![NeuroGeMS Screenshot](https://user-images.githubusercontent.com/8584126/95290114-59e42900-0821-11eb-8e43-a708959e8449.gif)

## 🌟 Features

- Multimodal learning capabilities
<!-- - Explainability using SHAP (SHapley Additive exPlanations) -->
- Reproducibility and experiment tracking with MLflow integration
- Extensible architecture for easy integration of new techniques and models

## 🛠️ Setup

### Option 1: Executable Installer
Download the latest executable installer from the releases page. Run the installer and follow the on-screen instructions to install NeuroGeMS on your system.

### Option 2: Manual Setup

Ensure you have [Node](https://nodejs.org/en/download/) v16.2.0 and [Python](https://www.python.org/downloads/) 3.9 installed, then clone this repository. After it's cloned, navigate to the project's root directory on your computer and run the following scripts in a terminal application *(e.g., Git Bash)*:

**Install Python dependencies:**
```bash
pip3 install -r requirements.txt
```

**Install Node dependencies:**
```bash
yarn install
```

## ⚙️ Config

**Electron:** Electron's `main.js`, `preload.js`, and `renderer.js` files can be found in the project's root directory.

**React:** React files can be found in the `./src/` folder, the custom toolbar is in `./src/components/toolbar`.

**Python:** Python scripts can be created in the `./app.py` file and used on events via [REST](https://developer.mozilla.org/en-US/docs/Glossary/REST) calls.

## 📜 Scripts

Below are the scripts you can run to package the application. The complete list of scripts that are available can be found in the `package.json` file of the project's root directory, in the `scripts` section.

> ⚠️ &nbsp;When packaging, you must install [PyInstaller](https://pypi.org/project/pyinstaller) and add its path in your environment variables. 

**Start Developer Mode:**
```bash
yarn run start
```

**Package Windows:**
```bash
yarn run build:package:windows
```

**Package macOS:**
```bash
yarn run build:package:mac
```

**Package Linux:**
```bash
yarn run build:package:linux
```

## 🙏 Acknowledgements

NeuroGeMS leverages the following open-source projects:

- [Electron React Python Template](https://github.com/iPzard/electron-react-python-template) - Multi-platform Electron template, using React & Redux Toolkit with Python/Flask microservices.
- [Minimal UI Kit](https://github.com/minimal-ui-kit/material-kit-react) - React dashboard built with Material UI components.

## 🦟 Bugs

Report any bugs on the project's [issues page](https://github.com/KEDRI-AUT/NeuroGeMS/issues). Be sure to include steps to reproduce so they can be spotted easily.

## 🏷️ License

GNU Affero General Public License v3.0 © [KEDRI-AUT](https://github.com/KEDRI-AUT/NeuroGeMS/blob/main/LICENSE)