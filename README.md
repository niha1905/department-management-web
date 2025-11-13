# department management

## Overview
department management is a full-stack web application with a Chrome extension component. This project demonstrates modern web development architecture with separated frontend, backend, and browser extension components.

## Project Structure

```
grandmagnum123/
├── backend/          # Backend server code
├── frontend/         # Frontend application
├── chrome-extension/ # Chrome browser extension
├── node_modules/     # Dependencies
├── package.json      # Project dependencies
└── package-lock.json # Locked dependency versions
```

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js/Express
- **Browser Extension**: Chrome Extension API
- **Dependencies**:
  - dayjs - Date and time utilities
  - react-icons - Icon library

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Chrome browser (for extension testing)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/niha1905/grandmagnum123.git
cd grandmagnum123
```

2. Install dependencies:
```bash
npm install
```

3. Set up the backend:
```bash
cd backend
npm install
npm start
```

4. Set up the frontend:
```bash
cd frontend
npm install
npm start
```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this project

## Features

- Full-stack web application architecture
- Chrome browser extension integration
- Modern React-based frontend
- RESTful API backend
- Modular and scalable codebase

## Development

This project uses a monorepo structure where frontend, backend, and extension code are maintained in separate directories for better organization and maintainability.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License

## Author

**Nihaarika S**  
Department of Computer Science and Engineering  
SRM Institute of Science and Technology, Chennai, India  
📧 ns1490@srmist.edu.in  
🌐 [LinkedIn](https://www.linkedin.com/in/nihaarika-s-23033a259/)
