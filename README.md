# FinLitGame_FHE

A privacy-preserving educational platform that delivers personalized financial literacy game experiences using Fully Homomorphic Encryption (FHE). The system allows players to engage in interactive financial challenges while keeping their knowledge level, decisions, and progress completely encrypted and private.

## Project Background

Financial literacy education faces several challenges:

- **Privacy concerns**: Players may not want to share personal financial knowledge or decisions.  
- **Personalization difficulty**: Traditional educational games cannot adapt accurately without accessing sensitive data.  
- **Data centralization risks**: Storing player performance in plaintext exposes it to misuse or breaches.  
- **Limited adaptive learning**: Games struggle to provide tailored challenges without detailed insights.

FinLitGame_FHE addresses these issues by:

- Encrypting player profiles, decisions, and progress using FHE  
- Performing secure, encrypted computations to generate personalized game content  
- Maintaining full privacy while providing adaptive learning experiences  
- Allowing educators or administrators to access aggregated insights without exposing individual data

## Features

### Core Functionality

- **Encrypted Player Profiles**: Store financial knowledge and decisions securely on the client side.  
- **FHE-based Personalization**: Game challenges and learning paths are computed on encrypted data.  
- **Dynamic Content Generation**: Tailored questions, scenarios, and simulations for each player.  
- **Progress Tracking**: Securely monitor learning progress and skill improvements.  
- **Leaderboard and Rewards (Privacy-Preserving)**: Aggregated rankings without revealing individual identities.

### Privacy & Security

- **Client-side Encryption**: All player data is encrypted before being sent to the server.  
- **Homomorphic Computation**: Game logic and challenge generation occur entirely on encrypted data.  
- **Immutable Records**: Player actions and results cannot be tampered with.  
- **Anonymous Learning**: Players’ identities are never exposed to administrators or other participants.  
- **Secure Aggregation**: Overall performance metrics are aggregated without revealing individual details.

## Architecture

### Backend

- **FHE Computation Engine**: Generates personalized challenges and evaluates player performance securely.  
- **Encrypted Database**: Stores encrypted profiles, decisions, and game outcomes.  
- **Analytics Module**: Provides aggregated insights for educators without compromising privacy.

### Frontend Application

- **React + TypeScript**: Interactive, responsive user interface.  
- **Dynamic Challenge Renderer**: Adapts content based on encrypted computations.  
- **Progress Dashboard**: Visualizes player progress while preserving anonymity.  
- **Encrypted Communication**: Ensures all data exchanges remain confidential.

## Technology Stack

### Backend

- **Node.js / Python**: Manages encrypted computations and secure storage.  
- **FHE Libraries**: Perform encrypted arithmetic, adaptive learning logic, and aggregation.  
- **Database**: Secure encrypted storage for game data and logs.

### Frontend

- **React 18 + TypeScript**: Modern, responsive interface.  
- **Tailwind CSS**: Interactive, adaptive styling for dashboards and game screens.  
- **Canvas / WebGL**: Rendering game elements and interactive challenges.

## Installation

### Prerequisites

- Node.js 18+  
- Python 3.10+ (for backend computations)  
- npm / yarn / pnpm package manager

### Setup

1. Clone the repository.  
2. Install frontend dependencies: `npm install` or `yarn install`.  
3. Configure backend FHE computation engine.  
4. Start frontend: `npm start` or `yarn start`.  
5. Begin gameplay with encrypted profiles.

## Usage

- **Create Encrypted Profile**: Players enter knowledge assessments and preferences.  
- **Play Personalized Challenges**: FHE engine generates secure adaptive content.  
- **View Progress**: Check progress dashboards and aggregated insights.  
- **Educator Dashboard**: Monitor aggregated performance metrics without accessing raw player data.

## Security Features

- **Encrypted Player Data**: All knowledge, decisions, and progress remain encrypted.  
- **Homomorphic Challenge Generation**: Personalization occurs without decrypting sensitive information.  
- **Immutable Records**: Game actions are securely logged for reproducibility.  
- **Anonymous Aggregation**: Performance metrics and leaderboards protect individual privacy.

## Future Enhancements

- **Gamified Collaborative Challenges**: Securely compete or collaborate with peers without revealing data.  
- **AI-driven Adaptive Learning**: FHE-powered AI dynamically adjusts difficulty based on encrypted metrics.  
- **Mobile Platform Optimization**: Deliver secure gameplay across devices.  
- **Cross-game Aggregation**: Analyze encrypted data across multiple educational games.  
- **Expanded Analytics**: Provide educators with deeper insights into learning trends without compromising privacy.

FinLitGame_FHE combines privacy, personalized learning, and interactive gameplay, enabling users to improve their financial literacy while keeping their data fully protected.
