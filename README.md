# Aivox Dashboard

A minimal voice agent management dashboard built with React, Vite, and Tailwind CSS.

## Features

- **Authentication**: Simple login page (accepts any credentials for demo)
- **Voice Agents**: View all voice agents with their type (inbound/outbound) and status
- **Call History**: Detailed call history with costs, duration, and timestamps
- **Mock Data**: Pre-populated with sample agents and call records

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

### Login

For demo purposes, you can log in with any username and password combination.

## Project Structure

```
aivox-dashboard/
├── src/
│   ├── components/
│   │   ├── Login.jsx          # Login page
│   │   ├── Dashboard.jsx      # Main dashboard layout
│   │   ├── VoiceAgents.jsx    # Voice agents list view
│   │   └── CallHistory.jsx    # Call history table
│   ├── mockData.js            # Mock data for agents and calls
│   ├── App.jsx                # Main app with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind CSS imports
├── index.html
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework

## Features Overview

### Voice Agents Page

- Displays all voice agents in a card grid
- Shows agent type (inbound/outbound)
- Displays status (active/inactive)
- Summary statistics for total agents, active agents, and total calls

### Call History Page

- Comprehensive table view of all calls
- Shows agent name, type, phone number, duration, timestamp, status, and cost
- Summary cards showing total calls, total cost, and average cost per call

## Future Enhancements

- Real authentication with backend API
- Real-time data fetching
- Filtering and search functionality
- Export call history to CSV
- Agent performance analytics
- Live call monitoring
