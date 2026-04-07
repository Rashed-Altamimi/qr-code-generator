# QR Code Generator

A simple, fast, and free QR code generator built with React and TypeScript. Convert any text or URL into a QR code instantly and download it as a PNG.

## Features

✅ **Instant QR Generation** - Real-time QR code generation as you type
✅ **Download as PNG** - Save QR codes to your computer
✅ **Mobile Friendly** - Works perfectly on all devices
✅ **No Backend** - Runs entirely in your browser
✅ **Privacy First** - Your data never leaves your device

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone this repository:
```bash
git clone https://github.com/YOUR_USERNAME/qr-code-generator.git
cd qr-code-generator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

Open [http://localhost:5173/qr-code-generator/](http://localhost:5173/qr-code-generator/) in your browser.

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository
1. Go to [github.com](https://github.com) and create a new repository named `qr-code-generator`
2. Clone it locally or push this project to that repository

### Step 2: Update Configuration
1. Update `package.json` - replace `YOUR_USERNAME` with your GitHub username:
```json
"homepage": "https://YOUR_USERNAME.github.io/qr-code-generator"
```

2. Ensure `vite.config.ts` has the correct base path:
```typescript
base: '/qr-code-generator/',
```

### Step 3: Deploy
1. Build the project:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

3. Go to your repository settings and confirm GitHub Pages is enabled, serving from the `gh-pages` branch.

4. Your QR code generator will be live at:
```
https://YOUR_USERNAME.github.io/qr-code-generator/
```

## Project Structure

```
src/
├── components/
│   ├── QRGenerator.tsx       # Main QR generator component
│   └── QRDownloadButton.tsx  # Download functionality
├── styles/
│   └── QRGenerator.css       # Component styling
├── App.tsx                   # App layout
└── App.css                   # Global styles
```

## Technologies Used

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **qrcode.react** - QR code generation
- **GitHub Pages** - Free hosting

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to GitHub Pages
- `npm run lint` - Run ESLint

## How It Works

1. User enters text or URL in the input field
2. QR code is instantly generated using `qrcode.react`
3. User can download the QR code as a PNG image
4. Everything runs client-side - no server needed

## Browser Support

Works in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT - Feel free to use this project for any purpose!

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
