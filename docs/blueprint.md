# **App Name**: MathCyber

## Core Features:

- PWA Installation: Enable users to install the web app on their desktop or mobile devices as a Progressive Web App.
- Terminal UI: Implement a terminal/cyberpunk-themed user interface.
- Terminal Input: Provide a terminal-like input component where users can type in mathematical questions.
- Step-by-Step Solution: Generate a step-by-step solution to the user's mathematical question, streamed to the Terminal Output component.
- AI-Powered Analysis: Use an AI to analyze the user's question and generate a step-by-step explanation of the solution. The AI acts as a tool and streams the solution.
- Mathematical Verification: Verify the AI-generated solution using a WebAssembly-compiled Rust mathematical engine.
- User Authentication: Implement user authentication via Supabase Auth, with options for SSO or email login.

## Style Guidelines:

- Primary color: Electric green (#7CFC00) for a terminal-like, vibrant feel.
- Background color: Dark grey (#1E1E1E) to mimic a command-line interface.
- Accent color: Bright cyan (#00FFFF) for interactive elements and highlights.
- Body and headline font: 'Space Grotesk' sans-serif, providing a techy and scientific feel. If longer text is needed, consider using Inter for the body.
- Code font: 'Source Code Pro' monospaced, for display of equations or other computer code.
- Use minimalist, line-based icons to match the terminal aesthetic.
- Implement subtle animations for the streaming of the solutions and loading states.