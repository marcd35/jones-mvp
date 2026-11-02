# **`Jones in the Fast Lane` `- Technical Design Document`**

> **Status: historical.** Written for an earlier attempt (Vite, Redux Toolkit, PixiJS). The current app (`jones-mvp`) uses Next.js, Zustand and plain DOM components, so the architecture, state-management, rendering, testing and deployment sections no longer apply. Still useful as a reference: **Data Models** and **Game Systems Implementation**.


**Version:** 1.0  
 **Date:** February 27, 2025  
 **Project:** Jones in the Fast Lane Remake  
 **Lead Architect:** \[Name\]

## **Table of Contents**

1. [Introduction](#introduction)  
2. [Architecture Overview](#architecture-overview)  
3. [Frontend Architecture](#frontend-architecture)  
4. [Data Models](#data-models)  
5. [State Management](#state-management)  
6. [Game Systems Implementation](#game-systems-implementation)  
7. [Rendering & Animation](#rendering--animation)  
8. [User Interface](#user-interface)  
9. [Save/Load System](#saveload-system)  
10. [Performance Considerations](#performance-considerations)  
11. [Testing Strategy](#testing-strategy)  
12. [Deployment Pipeline](#deployment-pipeline)  
13. [Third-Party Dependencies](#third-party-dependencies)  
14. [Development Workflow](#development-workflow)  
15. [Platform-Specific Considerations](#platform-specific-considerations)  
16. [Security Considerations](#security-considerations)  
17. [Appendices](#appendices)

## **Introduction**

This Technical Design Document (TDD) outlines the architecture, implementation details, and technical choices for the Jones in the Fast Lane remake. It serves as a blueprint for the development team and a reference for technical decision-making throughout the project lifecycle.

### **Purpose & Scope**

This document covers:

* The overall technical architecture of the game  
* Detailed implementation plans for game systems  
* Guidelines for code organization and standards  
* Performance targets and optimization strategies  
* Testing and deployment methodologies

### **Target Platforms**

* **Primary:** Web browsers (Desktop & Mobile)  
* **Secondary:** Progressive Web App (PWA)  
* **Future:** Native iOS and Android applications

### **Technical Goals**

1. Create a responsive, accessible game that works across devices  
2. Achieve consistent 60 FPS performance on target devices  
3. Design a maintainable codebase with clear separation of concerns  
4. Implement reliable save/load functionality  
5. Support future expansion and feature additions  
6. Ensure compatibility with modern browsers and devices

## **Architecture Overview**

### **System Architecture**

Jones in the Fast Lane will use a client-side architecture for the initial release, with optional backend integration for future multiplayer features.

\!\[System Architecture Diagram\]

#### **High-Level Components**

1. **Game Core** \- Central game logic and state management  
2. **Rendering Engine** \- Handles visual presentation and animations  
3. **UI Layer** \- Manages user interfaces and interactions  
4. **Asset Manager** \- Loads and manages game assets  
5. **Save System** \- Handles persistence of game state  
6. **Sound Engine** \- Manages audio playback and effects

### **Technology Stack**

| Component | Technology | Justification |
| ----- | ----- | ----- |
| Frontend Framework | React | Component-based architecture ideal for UI-heavy game, large ecosystem |
| State Management | Redux \+ Redux Toolkit | Predictable state management, time-travel debugging useful for game state |
| Rendering | HTML5 Canvas \+ PixiJS | Performance for animations, cross-platform compatibility |
| Styling | Styled Components \+ Tailwind CSS | Component-scoped styles with utility classes for rapid development |
| Build System | Vite | Fast development experience, efficient bundling |
| Testing | Jest \+ React Testing Library | Comprehensive testing framework with component testing |
| Animation | GSAP | High-performance animations with timeline support |
| Localization | i18next | Extensible localization framework |
| Data Format | JSON | Lightweight, human-readable |
| Storage | IndexedDB \+ LocalStorage | Client-side persistence with fallback |

### **Repository Structure**

jones-fast-lane/  
├── .github/               \# GitHub workflows and templates  
├── public/                \# Static assets  
│   ├── assets/            \# Game assets  
│   ├── fonts/             \# Custom fonts  
│   └── favicon.ico        \# Favicon  
├── src/  
│   ├── components/        \# React components  
│   │   ├── common/        \# Shared components  
│   │   ├── game/          \# Game-specific components  
│   │   ├── locations/     \# Location-specific components  
│   │   └── ui/            \# UI components  
│   ├── game/              \# Game logic  
│   │   ├── core/          \# Core game mechanics  
│   │   ├── entities/      \# Game entity definitions  
│   │   ├── systems/       \# Game systems  
│   │   └── ai/            \# AI opponent logic  
│   ├── hooks/             \# Custom React hooks  
│   ├── redux/             \# Redux state management  
│   │   ├── slices/        \# Redux toolkit slices  
│   │   ├── store.js       \# Redux store configuration  
│   │   └── middlewares/   \# Custom middlewares  
│   ├── services/          \# Service layer  
│   │   ├── storage/       \# Storage services  
│   │   ├── sound/         \# Sound services  
│   │   └── api/           \# API services (future use)  
│   ├── utils/             \# Utility functions  
│   ├── constants/         \# Game constants  
│   ├── styles/            \# Global styles  
│   ├── App.jsx            \# Root App component  
│   └── main.jsx           \# Entry point  
├── tests/                 \# Test files  
│   ├── unit/              \# Unit tests  
│   ├── integration/       \# Integration tests  
│   └── e2e/               \# End-to-end tests  
├── .eslintrc.js           \# ESLint configuration  
├── .prettierrc            \# Prettier configuration  
├── vite.config.js         \# Vite configuration  
├── package.json           \# npm package configuration  
└── README.md              \# Project documentation

## **Frontend Architecture**

### **Component Architecture**

The game uses a component-based architecture with React. Components are organized into the following categories:

1. **Core Components** \- Fundamental game elements (GameBoard, GameLoop, TimeManager)  
2. **Location Components** \- UI for each game location  
3. **Character Components** \- Player and NPC rendering and animations  
4. **UI Components** \- Menus, buttons, modals, and other interface elements  
5. **System Components** \- Components that manage specific game systems (Career, Education, Housing)

#### **Component Guidelines**

* Components should be small, focused, and reusable  
* Use functional components with hooks  
* Implement prop type validation  
* Consider performance implications (memoization, virtualization)  
* Separate presentation from logic where appropriate

### **Rendering Strategy**

The game uses a hybrid rendering approach:

* **React DOM** \- For UI elements, menus, and static game components  
* **Canvas/PixiJS** \- For game board, character animations, and visual effects  
* **SVG** \- For certain UI elements requiring scalability

#### **Canvas vs. DOM Strategy**

| Element Type | Rendering Method | Justification |
| ----- | ----- | ----- |
| Game Board | Canvas | Better performance for complex drawing operations |
| Characters | Canvas | Efficient animation and transformation |
| UI Components | DOM | Accessibility, ease of styling |
| Dialogs | DOM | Better text rendering, accessibility |
| Effects | Canvas | Performance for particle effects and animations |

## **Data Models**

### **Game State Model**

The core game state is structured as follows:

{  
  game: {  
    currentWeek: Number,  
    inflationRate: Number,  
    economyState: String, // "inflation" or "deflation"  
    economyCycleWeek: Number, // tracks weeks in current cycle  
    gamePhase: String, // "setup", "playing", "gameOver"  
    currentTurn: Number, // player index  
    randomEvents: Array,  
    newspaper: {  
      articles: Array,  
      hasBeenRead: Boolean  
    }  
  },  
  players: \[  
    {  
      id: String,  
      name: String,  
      avatar: String,  
      cash: Number,  
      savings: Number,  
      loans: Number,  
      assets: Array,  
      inventory: Object,  
      education: {  
        level: String,  
        courses: Array  
      },  
      career: {  
        job: String,  
        workplace: String,  
        experience: Number,  
        salary: Number  
      },  
      status: {  
        hunger: Boolean,  
        tired: Number,  
        clothingAge: Number,  
        happy: Number  
      },  
      goals: {  
        wealth: {  
          target: Number,  
          current: Number  
        },  
        education: {  
          target: String,  
          current: String  
        },  
        career: {  
          target: String,  
          current: String  
        },  
        happiness: {  
          target: Number,  
          current: Number  
        }  
      },  
      turn: {  
        timeRemaining: Number,  
        currentLocation: String,  
        hasWorked: Boolean,  
        hasStudied: Boolean  
      }  
    }  
  \],  
  locations: {  
    bank: {  
      interestRate: Number,  
      loanRate: Number,  
      investments: Array  
    },  
    // Additional location-specific state...  
  },  
  ui: {  
    activeScreen: String,  
    activeModal: String,  
    notifications: Array,  
    selectedAction: String  
  }  
}

### **Entity Models**

#### **Player Model**

// Expanded Player model with detailed properties  
{  
  id: String,  
  name: String,  
  avatar: String,  
    
  // Financial  
  cash: Number,  
  savings: Number,  
  loans: \[{  
    amount: Number,  
    interestRate: Number,  
    weeksTaken: Number  
  }\],  
    
  // Assets & Inventory  
  assets: \[{  
    name: String,  
    value: Number,  
    type: String,  
    purchasedWeek: Number  
  }\],  
  inventory: {  
    food: {  
      amount: Number,  
      expiryWeek: Number  
    },  
    clothing: \[{  
      type: String, // "casual", "business", "formal"  
      condition: Number, // 0-100  
      purchasedWeek: Number  
    }\]  
  },  
    
  // Education  
  education: {  
    level: String,  
    courses: \[{  
      name: String,  
      progress: Number,  
      completedWeek: Number  
    }\],  
    skills: {  
      business: Number,  
      technical: Number,  
      academic: Number  
    }  
  },  
    
  // Career  
  career: {  
    currentJob: {  
      title: String,  
      workplace: String,  
      salary: Number,  
      hoursWorked: Number  
    },  
    experience: {  
      retail: Number,  
      food: Number,  
      office: Number,  
      technical: Number,  
      academic: Number  
    },  
    previousJobs: \[{  
      title: String,  
      workplace: String,  
      weeksWorked: Number  
    }\]  
  },  
    
  // Status  
  status: {  
    hunger: Boolean,  
    energy: Number, // 0-100  
    clothing: {  
      type: String,  
      age: Number  
    },  
    happiness: Number, // 0-100  
    health: Number // 0-100  
  },  
    
  // Goals  
  goals: {  
    wealth: {  
      target: Number,  
      current: Number  
    },  
    education: {  
      target: String,  
      current: String  
    },  
    career: {  
      target: String,  
      current: String  
    },  
    happiness: {  
      target: Number,  
      current: Number  
    }  
  },  
    
  // Current turn state  
  turn: {  
    timeRemaining: Number, // in hours  
    currentLocation: String,  
    actionsThisTurn: Array,  
    path: \[\] // current movement path  
  },  
    
  // Stats for end-game  
  statistics: {  
    weeksPlayed: Number,  
    totalEarned: Number,  
    totalSpent: Number,  
    jobsHeld: Number,  
    educationCompleted: Number,  
    itemsPurchased: Number,  
    locationVisits: Object // counts by location  
  }  
}

#### **Location Model**

{  
  id: String,  
  name: String,  
  type: String,  
  position: {  
    x: Number,  
    y: Number  
  },  
  connections: \[String\], // IDs of connected locations  
  travelTime: Number,  
  availableActions: \[String\],  
  requirements: {  
    timeOfDay: \[String\],  
    playerAttributes: Object  
  },  
  interactionData: {  
    // Location-specific data  
  }  
}

#### **Item Model**

{  
  id: String,  
  name: String,  
  description: String,  
  category: String,  
  basePrice: Number,  
  value: Number,  
  effects: {  
    happiness: Number,  
    energy: Number,  
    skills: Object  
  },  
  durability: Number, // if applicable  
  locations: \[String\], // where it can be purchased  
  requirements: Object, // requirements to purchase  
  imageAsset: String  
}

## **State Management**

### **Redux Store Structure**

The Redux store will be structured using Redux Toolkit's slice pattern:

// Root reducer composition  
{  
  game: gameSlice,  
  players: playersSlice,  
  locations: locationsSlice,  
  items: itemsSlice,  
  ui: uiSlice,  
  time: timeSlice,  
  events: eventsSlice  
}

#### **Key Slices**

1. **gameSlice** \- Core game state, turn management, game progress  
2. **playersSlice** \- Player states, inventories, statistics  
3. **locationsSlice** \- Location states, availability, special conditions  
4. **itemsSlice** \- Item catalog, prices, availability  
5. **uiSlice** \- UI state, active screens, modals  
6. **timeSlice** \- Game time management, week tracking  
7. **eventsSlice** \- Random events, triggered conditions

### **State Management Patterns**

1. **Action Creators** \- Standardized for all game actions  
2. **Thunks** \- For complex, asynchronous operations  
3. **Selectors** \- Memoized for efficient derived data  
4. **Middleware** \- For logging, analytics, and game rules enforcement

#### **Example Actions**

// Player movement  
movePlayer({ playerId, destinationId })

// Time passage  
consumeTime({ playerId, hours })

// Player actions  
performAction({ playerId, actionType, actionData })

// Game progression  
advanceTurn()  
startNewWeek()  
triggerEvent({ eventId, affectedPlayers })

// Career actions  
applyForJob({ playerId, jobId, locationId })  
work({ playerId, hours })

// Education actions  
enrollInCourse({ playerId, courseId })  
study({ playerId, hours })

// Shopping actions  
purchaseItem({ playerId, itemId, quantity })

### **Game Loop Implementation**

The game loop is implemented as a combination of:

1. **Turn-based loop** \- Controls player turns and week progression  
2. **Rendering loop** \- Handles animations and visual updates  
3. **Event system** \- Manages random events and triggered occurrences

// Simplified game loop pseudo-code  
function gameLoop() {  
  // Process beginning of turn  
  if (isNewTurn) {  
    preparePlayerTurn(currentPlayer);  
    applyStartOfTurnEffects(currentPlayer);  
  }  
    
  // Handle player input during their turn  
  if (hasPlayerAction) {  
    processPlayerAction(action);  
    updateGameState();  
    checkTurnEndingConditions();  
  }  
    
  // Process end of turn  
  if (isTurnEnding) {  
    applyEndOfTurnEffects(currentPlayer);  
    advanceToNextPlayer();  
  }  
    
  // Process end of week  
  if (isWeekEnding) {  
    applyEndOfWeekEffects();  
    startNewWeek();  
    checkVictoryConditions();  
  }  
    
  // Request next animation frame  
  requestAnimationFrame(gameLoop);  
}

## **Game Systems Implementation**

### **Time Management System**

The time system is a core mechanic of the game. It tracks:

* Turn time (hours remaining in current player's turn)  
* Week progression  
* Game calendar

#### **Implementation Details**

// Time slice structure  
{  
  currentWeek: Number,  
  currentDay: Number,  
  hoursByPlayer: {  
    \[playerId\]: Number // remaining hours  
  },  
  timeScale: Number, // for animations  
  isTimePaused: Boolean  
}

* Time consumption is tracked per action  
* Travel time is calculated based on distance between locations  
* Time visualized with clock UI component  
* Time checks trigger turn endings

### **Career System**

The career system manages:

* Job listings and requirements  
* Interview processes  
* Work experience accumulation  
* Salary calculations and payments

#### **Job Model**

{  
  id: String,  
  title: String,  
  location: String,  
  baseSalary: Number,  
  hoursPerShift: Number,  
  requirements: {  
    education: String,  
    experience: {  
      \[field\]: Number  
    },  
    skills: {  
      \[skill\]: Number  
    }  
  },  
  benefits: {  
    happiness: Number,  
    skillGain: Object  
  }  
}

#### **Implementation Details**

* Jobs are stored in a jobs database  
* Each location has a job listing that refreshes weekly  
* Experience is earned based on hours worked  
* Job interviews have success probability based on qualifications  
* Salary adjusts with inflation/deflation cycles

### **Education System**

The education system manages:

* Course offerings and prerequisites  
* Learning progression  
* Skill development  
* Certification/degree tracking

#### **Course Model**

{  
  id: String,  
  name: String,  
  location: String,  
  cost: Number,  
  duration: Number, // in weeks  
  prerequisites: {  
    courses: \[String\],  
    skills: Object  
  },  
  rewards: {  
    certification: String,  
    skills: Object  
  }  
}

#### **Implementation Details**

* Courses have enrollment requirements  
* Progress tracked by hours spent studying  
* Certifications unlock new job opportunities  
* Skills improve success rates in various activities

### **Economy System**

The economy system manages:

* Inflation/deflation cycles  
* Price adjustments  
* Currency tracking  
* Banking (savings, loans, investments)

#### **Implementation Details**

* Economic cycle tracked at game level  
* Prices and wages adjust automatically based on cycle  
* Investment returns calculated based on economic factors  
* Compound interest calculated weekly for savings and loans

### **Housing System**

The housing system manages:

* Rent collection and tracking  
* Housing quality effects on happiness  
* Housing options and upgrades

#### **Implementation Details**

* Rent due every 4 weeks  
* Missed payments trigger wage garnishment  
* Housing quality affects rest efficiency and happiness  
* Random events can be housing-specific (repairs, neighbors)

### **Hunger & Clothing Systems**

These systems manage basic needs:

* Food purchasing and consumption  
* Clothing quality and deterioration  
* Effects of neglecting these needs

#### **Implementation Details**

* Binary hunger state refreshes weekly  
* Food can be purchased for multiple weeks  
* Clothing deteriorates on a weekly basis  
* Visual indicators show hunger and clothing status

### **Random Events System**

The random events system provides:

* Unexpected challenges and opportunities  
* Narrative elements  
* Economic variability

#### **Event Model**

{  
  id: String,  
  title: String,  
  description: String,  
  trigger: {  
    probability: Number,  
    conditions: Object  
  },  
  effects: {  
    immediate: Object,  
    ongoing: Object,  
    duration: Number  
  },  
  playerChoices: \[  
    {  
      text: String,  
      outcomes: Object  
    }  
  \]  
}

#### **Implementation Details**

* Events triggered at start of week or during specific actions  
* Event effects can modify any game state  
* Some events require player decisions  
* Events displayed through newspaper interface

## **Rendering & Animation**

### **Rendering Architecture**

The game uses a layered rendering approach:

1. **Background Layer** \- Game board, location backgrounds  
2. **Character Layer** \- Player and NPC sprites  
3. **UI Overlay Layer** \- Interfaces, buttons, indicators  
4. **Effects Layer** \- Animations, transitions, particles  
5. **Modal Layer** \- Dialogs, notifications, newspaper

#### **Performance Optimizations**

* Texture atlasing for sprites  
* Layer compositing for efficient updates  
* Off-screen canvas for complex rendering  
* Conditional rendering for UI elements  
* Memoization of expensive calculations

### **Animation System**

Animations are handled through a combination of:

1. **Sprite Animations** \- Character movements and actions  
2. **CSS Transitions** \- UI element animations  
3. **GSAP Animations** \- Complex sequences and effects

#### **Animation Types**

| Type | Implementation | Examples |
| ----- | ----- | ----- |
| Character Movement | Sprite sheets \+ PixiJS | Walking between locations |
| UI Transitions | CSS/GSAP | Menu opening/closing |
| Effects | Canvas particles | Achievement unlocks |
| Environmental | Background animations | Day/night cycles |

#### **Animation Implementation**

// Example animation controller  
class AnimationController {  
  constructor() {  
    this.animations \= new Map();  
    this.spriteSheets \= new Map();  
  }  
    
  loadSpriteSheet(id, path, frameData) {  
    // Load and parse sprite sheet  
  }  
    
  createAnimation(id, spriteSheetId, frameSequence, options) {  
    // Define an animation from frames  
  }  
    
  playAnimation(id, target, options) {  
    // Play animation on target element/sprite  
  }  
    
  update(deltaTime) {  
    // Update all active animations  
  }  
}

## **User Interface**

### **UI Component Library**

The UI follows a component-based architecture with these key elements:

1. **Core Components**

   * Button (primary, secondary, action)  
   * Panel (information, control)  
   * Modal (dialog, notification)  
   * Card (information, selection)  
   * Icon (system, item, status)  
2. **Game-Specific Components**

   * LocationEntry (clickable location)  
   * ActionMenu (contextual actions)  
   * StatusPanel (player stats)  
   * TimeDisplay (turn time remaining)  
   * InventorySlot (item display)  
3. **Specialized Components**

   * JobListing (career opportunities)  
   * CourseCard (education options)  
   * ShopItem (purchasable goods)  
   * Newspaper (event display)  
   * GoalTracker (progress visualization)

### **UI Flow & Navigation**

The UI navigation follows this hierarchy:

1. **Main Menu**

   * New Game  
   * Load Game  
   * Options  
   * Credits  
2. **Game Setup**

   * Player selection/customization  
   * Goal setting  
   * Opponent configuration  
3. **Main Game View**

   * Game board (central)  
   * Player status (top)  
   * Time display (bottom)  
   * Action menu (contextual)  
4. **Location Interactions**

   * Location-specific interfaces  
   * Action selection  
   * Transaction handling  
   * Information display  
5. **System Interfaces**

   * Inventory management  
   * Career management  
   * Education management  
   * Investment handling

### **Accessibility Considerations**

* Keyboard navigation for all interactive elements  
* Screen reader compatibility  
* Color contrast compliance (WCAG AA minimum)  
* Text scaling for readability  
* Alternative text for visual elements  
* Colorblind-friendly palette options  
* Game speed adjustments

## **Save/Load System**

### **Save Data Structure**

The save system captures the complete game state:

{  
  metadata: {  
    saveVersion: String,  
    gameVersion: String,  
    timestamp: Number,  
    gameName: String,  
    thumbnail: String // Base64 encoded  
  },  
  gameState: {  
    // Complete Redux store state  
  }  
}

### **Implementation Approach**

#### **Local Storage**

For web and PWA versions:

* IndexedDB as primary storage (no size limits)  
* LocalStorage as fallback (5MB limit)  
* Each save is a separate entry in the database  
* Autosave occurs after each turn

// Save game implementation  
async function saveGame(state, metadata) {  
  const saveData \= {  
    metadata: {  
      saveVersion: SAVE\_VERSION,  
      gameVersion: GAME\_VERSION,  
      timestamp: Date.now(),  
      ...metadata  
    },  
    gameState: state  
  };  
    
  try {  
    // Try IndexedDB first  
    if (window.indexedDB) {  
      await saveToIndexedDB('jones-saves', saveData);  
      return true;  
    }  
      
    // Fall back to localStorage  
    localStorage.setItem(  
      \`jones-save-${metadata.gameName || Date.now()}\`,  
      JSON.stringify(saveData)  
    );  
    return true;  
  } catch (error) {  
    console.error('Save failed:', error);  
    return false;  
  }  
}

#### **Cloud Saves (Future)**

For future implementation:

* Firebase or custom backend for cloud saves  
* Sync mechanism for cross-device play  
* Authentication for user-specific saves

### **Save Management**

* Auto-saves after each turn  
* Manual save options with custom names  
* Save thumbnails showing game state  
* Save versioning for compatibility  
* Save import/export functionality

## **Performance Considerations**

### **Performance Targets**

* 60 FPS minimum on target devices  
* Load time under 3 seconds  
* Memory usage below 200MB  
* Smooth animations and transitions

### **Optimization Strategies**

1. **Asset Optimization**

   * Image compression and right-sizing  
   * Sprite atlasing  
   * Audio optimization  
   * Lazy loading of non-essential assets  
2. **Render Optimization**

   * Layer compositing  
   * Off-screen rendering  
   * Culling invisible elements  
   * Throttling animations when inactive  
3. **State Management Optimization**

   * Memoized selectors  
   * Batched updates  
   * Immutable data structures  
   * Middleware performance profiling  
4. **Memory Management**

   * Object pooling for frequent creations  
   * Asset unloading when not needed  
   * Memory leak detection  
   * Garbage collection hints

### **Performance Monitoring**

* In-game FPS counter (dev mode)  
* Performance metrics logging  
* Chrome DevTools performance profiles  
* Automated performance testing

## **Testing Strategy**

### **Testing Approach**

The project employs a multi-layered testing strategy:

1. **Unit Testing**

   * Game logic and algorithms  
   * Individual component functionality  
   * State management  
   * Utility functions  
2. **Integration Testing**

   * Component interactions  
   * Game system integrations  
   * State transitions  
   * Event handling  
3. **End-to-End Testing**

   * Complete game flows  
   * User interaction paths  
   * Save/load functionality  
   * Cross-browser compatibility  
4. **Performance Testing**

   * Frame rate benchmarking  
   * Memory usage profiles  
   * Load time measurements  
   * CPU/GPU utilization

### **Testing Tools**

| Testing Type | Tools | Focus Areas |
| ----- | ----- | ----- |
| Unit | Jest, React Testing Library | Functions, Components |
| Integration | Jest, React Testing Library | System interactions |
| E2E | Cypress | User journeys |
| Performance | Lighthouse, Chrome DevTools | Metrics, Optimizations |

### **Test Implementation**

// Example unit test for time system  
describe('Time System', () \=\> {  
  test('consuming time reduces player hours correctly', () \=\> {  
    // Arrange  
    const initialState \= {  
      time: {  
        hoursByPlayer: {  
          player1: 12  
        }  
      }  
    };  
      
    // Act  
    const newState \= timeReducer(initialState, consumeTime({  
      playerId: 'player1',  
      hours: 3  
    }));  
      
    // Assert  
    expect(newState.time.hoursByPlayer.player1).toBe(9);  
  });  
    
  test('turn ends when time reaches zero', () \=\> {  
    // Test implementation  
  });  
});

## **Deployment Pipeline**

### **Development Workflow**

1. **Local Development**

   * Feature branches from `develop`  
   * Local testing and validation  
   * Code review via pull requests  
   * Merge to `develop` after approval  
2. **Continuous Integration**

   * Automated testing on every PR  
   * Linting and code quality checks  
   * Build verification  
   * Performance benchmarking  
3. **Staging Deployment**

   * Automated deployment to staging environment  
   * Integration testing  
   * QA validation  
   * Performance verification  
4. **Production Release**

   * Manual approval for promotion  
   * Versioned release creation  
   * Deployment to production CDN  
   * Post-deployment verification

### **Environments**

| Environment | Purpose | Update Frequency |
| ----- | ----- | ----- |
| Development | Active development | Continuous |
| Testing | Automated test runs | Per PR/commit |
| Staging | Pre-release validation | After develop merges |
| Production | Live player access | After release approval |

### **Deployment Configuration**

\# Example GitHub Actions workflow  
name: Build and Deploy

on:  
  push:  
    branches: \[ main, develop \]  
  pull\_request:  
    branches: \[ develop \]

jobs:  
  test:  
    runs-on: ubuntu-latest  
    steps:  
      \- uses: actions/checkout@v3  
      \- uses: actions/setup-node@v3  
        with:  
          node-version: '16'  
      \- run: npm ci  
      \- run: npm test  
    
  build:  
    needs: test  
    runs-on: ubuntu-latest  
    steps:  
      \- uses: actions/checkout@v3  
      \- uses: actions/setup-node@v3  
        with:  
          node-version: '16'  
      \- run: npm ci  
      \- run: npm run build  
      \- uses: actions/upload-artifact@v3  
        with:  
          name: build  
          path: dist  
    
  deploy:  
    if: github.ref \== 'refs/heads/main'  
    needs: build  
    runs-on: ubuntu-latest  
    steps:  
      \- uses: actions/download-artifact@v3  
        with:  
          name: build  
          path: dist  
      \- name: Deploy to Firebase  
        uses: w9jds/firebase-action@master  
        with:  
          args: deploy \--only hosting  
        env:  
          FIREBASE\_TOKEN: ${{ secrets.FIREBASE\_TOKEN }}

## **Third-Party Dependencies**

### **Core Dependencies**

| Dependency | Purpose | Version |
| ----- | ----- | ----- |
| React | UI Framework | 18.x |
| Redux | State Management | 4.x |
| Redux Toolkit | Redux Utilities | 1.x |
| PixiJS | Canvas Rendering | 7.x |
| GSAP | Animation | 3.x |
| Styled Components | Component Styling | 6.x |
| Tailwind CSS | Utility-first CSS | 3.x |
| Howler.js | Audio Management | 2.x |
| date-fns | Date Manipulation | 2.x |
| i18next | Localization | 22.x |

### **Development Dependencies**

| Dependency | Purpose | Version |
| ----- | ----- | ----- |
| Vite | Build System | 4.x |
| TypeScript | Type Checking | 5.x |
| ESLint | Code Linting | 8.x |
| Prettier | Code Formatting | 2.x |
| Jest | Testing | 29.x |
| React Testing Library | Component Testing | 14.x |
| Cypress | E2E Testing | 12.x |
| Storybook | Component Development | 7.x |

### **Dependency Management**

* Dependencies locked to specific versions  
* Weekly automated dependency updates  
* Security vulnerability scanning  
* Bundle size monitoring

## **Development Workflow**

### **Git Workflow**

The project follows a modified GitFlow workflow:

1. `main` \- Production releases  
2. `develop` \- Integration branch  
3. `feature/*` \- New features  
4. `bugfix/*` \- Bug fixes  
5. `release/*` \- Release preparation

#### **Branch Naming**

* `feature/add-housing-system`  
* `bugfix/fix-time-calculation`  
* `release/v1.0.0`

### **Code Standards**

1. **JavaScript/TypeScript**

   * Follow Airbnb JavaScript Style Guide  
   * Use TypeScript for type safety  
   * Prefer functional programming patterns  
   * Document complex functions and algorithms  
2. **React Components**

   * One component per file  
   * Use functional components with hooks  
   * PropTypes or TypeScript for props  
   * Extract complex logic to custom hooks  
3. **CSS/Styling**

   * Use Styled Components for component-specific styles  
   * Use Tailwind for utility classes  
   * Maintain consistent naming conventions  
   * Follow BEM principles where applicable

### **Documentation**

* In-code documentation with JSDoc  
* README.md for each major directory  
* API documentation with examples  
* Architecture diagrams  
* System interaction documentation

### **Development Tools**

* VS Code as recommended editor  
* ESLint \+ Prettier integration  
* Git hooks for pre-commit validation  
* Redux DevTools for state debugging  
* React DevTools for component inspection

## **Platform-Specific Considerations**

### **Browser Compatibility**

**Target Browsers:**

* Chrome (latest 3 versions)  
* Firefox (latest 3 versions)  
* Safari (latest 3 versions)  
* Edge (latest 3 versions)  
* iOS Safari (latest 2 versions)  
* Android
