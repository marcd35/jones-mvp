# **`Jones in the Fast Lane` `- Game Design Document`**

**Version:** 1.0  

**Date:** February 27, 2025  

**Project Type:** 90s Game Recreation with Modern Development Practices  

**Platform:** Web-based with future conversion to iOS and Android

## TABLE OF CONTENTS

1. [Game Overview](#game-overview)  
     
2. [Core Game Mechanics](#core-game-mechanics)  
     
3. [Gameplay Systems](#gameplay-systems)  
     
4. [User Interface](#user-interface)  
     
5. [Characters](#characters)  
     
6. [Environments](#environments)  
     
7. [Progression](#progression)  
     
8. [Technical Specifications](#technical-specifications)  
     
9. [Asset Requirements](#asset-requirements)  
     
10. [Project Timeline](#project-timeline)

## GAME OVERVIEW

### Concept

Jones in the Fast Lane is a life simulation game where players navigate the challenges of modern life through time and resource management. Players compete against each other or AI opponents to achieve customizable life goals related to wealth, education, career, and happiness.

### Classic Gameplay Recreation

This project recreates Sierra On-Line's 1991 classic turn-based life simulation game. Players balance four key life goals (wealth, happiness, education, and career) while competing against AI (Jones) or up to four human players taking turns. The first player to reach their personal goals wins.

### Target Audience

- Retro game enthusiasts  
    
- Strategy and simulation game fans  
    
- Players interested in resource management games  
    
- Age range: 12+

### Unique Selling Points

- Nostalgic recreation of a classic Sierra game with modern improvements  
    
- Balanced competition between different life strategies  
    
- Short gameplay sessions with high replayability  
    
- Multiple valid paths to victory

### Design Pillars

1. **Strategic Decision Making** \- Every action should present meaningful choices with clear tradeoffs  
     
2. **Time as Currency** \- Managing limited time is the core challenge  
     
3. **Multiple Success Paths** \- Different strategies should be viable  
     
4. **Escalating Complexity** \- Easy to learn, with depth emerging through play

### Player Experience Goals

#### Primary Experience Goals

1. **Strategic Life Management**: Players should feel empowered to make meaningful life choices with clear consequences, experiencing the satisfaction of navigating trade-offs between time, money, education, and career advancement.  
     
2. **Personalized Success Path**: Players should be able to define their own version of success through customizable goals, experiencing the game differently based on their priorities (wealth, education, career, or happiness).  
     
3. **Competitive Progress**: Players should experience healthy competition against AI or human opponents, with visible progress creating tension and motivation to optimize their decisions.  
     
4. **Time Pressure Decisions**: Players should feel the constant pressure of limited time, creating meaningful moments of prioritization that mirror real-life decision-making.

#### Emotional Experience Goals

1. **Nostalgic Recreation**: Players familiar with the original game should experience a sense of nostalgia while appreciating modern improvements, recognizing familiar elements while discovering new enhancements.  
     
2. **Escalating Mastery**: Players should experience a sense of growing competence as they learn optimal strategies, with satisfaction derived from increasingly efficient decision-making.  
     
3. **Risk vs. Reward Tension**: Players should feel moments of genuine uncertainty when deciding between conservative strategies and potentially higher-reward risks (like investments, education commitments, or career changes).  
     
4. **Recovery from Setbacks**: Players should experience occasional setbacks (through random events or poor decisions) but always feel they have pathways to recovery and adaptation.

#### Social Experience Goals

1. **Varied Competition Styles**: When playing multiplayer, players should recognize and react to different opponent strategies, creating dynamic competition that evolves throughout gameplay.  
     
2. **Strategy Comparison**: Players should be able to easily compare their progress with opponents, creating natural conversation points about differing approaches to success.  
     
3. **Shared Narrative Moments**: Players should experience memorable game moments through newspaper events and random occurrences that become storytelling opportunities.

---

## CORE GAME MECHANICS

### Game Setup

- Players can play solo against Jones (AI) or with up to four human players  
    
- At start, players set personal goals in four categories:

    \- Wealth: Financial assets and cash

    \- Happiness: Quality of life and possessions

    \- Education: Academic achievements

    \- Career: Job level and position

- The higher the percentage set for each goal, the harder it is to achieve  
    
- Initial settings determine game difficulty and length

### Turn Structure

- Players take turns in a round-robin fashion  
    
- Each turn represents one week in the game world  
    
- Players have 12 hours of in-game time per turn to perform actions  
    
- Turn ends when player chooses to end it or runs out of time

### Time Management

- Each action consumes time (measured in hours)  
    
- Players start with 12 hours per week  
    
- Time consumption:

    \- Travel between locations: 0.615 hours per step

    \- Shopping: 1 hour per action

    \- Working: 1 hour per work action

    \- Studying: 1 hour per study action

    \- Resting: Variable, increases energy

    \- Job hunting: 1 hour per attempt

### Resource Management

- **Money** \- Earned from jobs, used for purchases, rent, education  
    
- **Possessions** \- Items that improve quality of life or job prospects  
    
- **Skills** \- Learned through education or experience  
    
- **Energy** \- Consumed by actions, replenished by rest and food  
    
- **Career Level** \- Determines job opportunities and salary  
    
- **Hunger** \- Boolean state affecting time availability and health costs  
    
- **Clothing** \- Affects job prospects and social status

### Goals & Victory Conditions

- Game ends when first player achieves all their goals  
    
- Default goals:

    \- Wealth: Accumulate $2000 in cash/assets

    \- Career: Reach specified career level

    \- Education: Reach specified education level

    \- Happiness: Acquire specific quality-of-life items

- Customizable goal levels for varied game length and difficulty

## GAMEPLAY SYSTEMS

### Time System

- Each turn represents one week in game time  
    
- Players have 12 hours of available time per week  
    
- Travel between locations consumes time (0.615 hours per step)  
    
- Time does not pass if player takes no action  
    
- Actions such as working, eating, and enrolling in courses consume 1 hour each  
    
- If time runs out during travel, player returns to their home (Either low_income_housing or LeSecurity depending on where they choose to live) 
    
- Time is displayed as a clock showing current week and remaining hours  
    
- When 12 hours are depleted, turn automatically ends

### Hunger System

- Players have a binary hunger state (hungry or not hungry)  
    
- Players become hungry at the start of each week  
    
- If player does not buy food when hungry:

    \- They lose 4 hours of playtime the following week

    \- They receive a doctor's bill of $50 (subject to inflation/deflation)

    \- They lose 2 additional hours of time

- Buying any food item sets hunger state to false for the current week  
    
- Food options:

    \- **Monolith Burgers:**

        \- Hamburgers: $82

        \- Cheeseburger: $93

        \- Astro Chicken: $130

        \- Fries: $68

        \- Shakes: $107

        \- Colas: $72

    \- **Black's Market:**

        \- Food for 1 week \- $35

        \- Food for 2 weeks \- $65

        \- Food for 4 weeks \- $112

### Clothing System

- Clothing age is tracked (weeks since last purchase)  
    
- Every week, clothing age increases by 1  
    
- At 6 weeks, player is notified their clothes are worn out  
    
- If player doesn't buy new clothes by week 7, character appears in barrel costume  
    
- Wearing a barrel restricts access to jobs requiring formal attire  
    
- Clothing options:

    \- Business Suit: $217

    \- Dress Clothes: $92

    \- Casual Clothes: $53

- Player can own multiple pairs of clothing; highest tier is worn by default  
    
- Purchasing new clothes resets clothing age to 0

### Inflation/Deflation System

- Economy alternates between inflation and deflation cycles  
    
- Each cycle lasts 10-15 weeks before switching  
    
- During inflation, prices and wages increase by 10%  
    
- During deflation, prices and wages decrease by 5%  
    
- All values are rounded to nearest whole number  
    
- Affects job wages, item prices, and service fees

### Career System

#### Job Locations and Positions

|Location|Position|Hourly Wage|Requirements|

|---|---|---|---|

|**Z-Mart Discount**||||

||Clerk|$4/hr|None|

||Assistant Manager|$6/hr|None|

||Manager|$7/hr|Trade School+, Experience|

|**Monolith Burgers**||||

||Cook|$4/hr|None|

||Clerk|$5/hr|None|

||Assistant Manager|$6/hr|Trade School|

||Manager|$7/hr|Trade School+, Experience|

|**QT Clothing**||||

||Salesperson|$7/hr|Experience|

||Assistant Manager|$9/hr|Trade School, Experience|

||Manager|$12/hr|Advanced education|

|**Socket City Appliance**||||

||Salesperson|$5/hr|None|

||Electronics Repair|$11/hr|Technical education|

||Manager|$14/hr|Advanced education, Experience|

|**Hi-Tech U**||||

||Janitor|$4/hr|None|

||Teacher|$11/hr|College education|

||Professor|$21/hr|Advanced degree|

|**Factory**||||

||Janitor|$7/hr|None|

||Assembly Worker|$8/hr|None|

||Secretary|$9/hr|Basic education|

||Machinist's Helper|$10/hr|Basic technical skills|

||Executive Secretary|$18/hr|Advanced education|

||Machinist|$19/hr|Technical training|

||Department Manager|$23/hr|Management experience|

||Engineer|$24/hr|Engineering degree|

||General Manager|$26/hr|Advanced degree, Experience|

|**Bank**||||

||Janitor|$6/hr|None|

||Teller|$10/hr|Basic education|

||Assistant Manager|$14/hr|Business education|

||Manager|$19/hr|Advanced business degree|

||Investment Broker|$23/hr|Finance degree|

|**Black's Market**||||

||Janitor|$5/hr|None|

||Checker|$8/hr|None|

||Butcher|$12/hr|Experience|

||Assistant Manager|$15/hr|Management experience|

||Manager|$18/hr|Advanced education|

|**Rent Office**||||

||Groundskeeper|$6/hr|None|

||Apartment Manager|$8/hr|Basic management skills|

- All wages fluctuate based on the inflation/deflation system  
    
- Job availability depends on meeting requirements for education, experience, and work history  
    
- Working builds experience in that career field  
    
- Job interviews have skill check requirements

### Education System

**Class Levels:**

- Trade School

    \- Electronics

    \- Pre-Engineer

        \- Engineering

- Jr. College

    \- Bus. Admin

    \- Academic

        \- Grad School

            \- Post Doctoral

                \- Research

                    \- Publishing

- Each level unlocks new job opportunities  
    
- Courses cost money and time  
    
- Education is required for higher-paying jobs

### Economy System

- Bank accounts with interest for savings  
    
- Loans available with interest payments  
    
- Stock Market investing options:

    \- T-Bills

    \- Gold

    \- Silver

    \- Pork Bellies

    \- Blue Chip Stocks

    \- Penny Stocks

### Housing System

- Housing options:

    \- Low income housing (cheaper but 5% robbery risk and lower happiness)

    \- Luxury Condo (highest cost, highest happiness)

- Rent due every 4 weeks  
    
- If player does not pay, wages are garnished (75% of earnings)

### Shopping System

- Different stores specialize in different item categories  
    
- Some stores vary their items depending on the week  
    
- Essential items (food, clothing) vs luxury items (entertainment)

### Random Events

- Periodic events that can help or hinder progress:

    \- Unexpected bills

    \- Family emergencies

    \- Lucky finds

    \- Networking opportunities

    \- Health issues (including doctor's bill for not eating)

## USER INTERFACE

### Main Game Screen

- Central game board showing all locations  
    
- Clock displaying remaining time left in turn  
    
- Action buttons for common functions  
    
- Navigation controls  
    
- Player statistics panel showing:

    \- Career information

    \- Financial status

    \- Goods owned

    \- Education level

    \- Investments

### Player Statistics Panel

**Financial Information:**

- Works at: *career*  
    
- Position: *career title*  
    
- Hourly Wage: $*salary*  
    
- Cash: *cash\_on\_hand*  
    
- Savings: *cash\_in\_bank*  
    
- Rent Owed: *unpaid\_rent*  
    
- Loan Balance: *loan\_balance*  
    
- Total Goods: *total\_goods*  
    
- Net Worth: *net\_worth*

**Goods:**

- *current\_outfit*  
    
- *weeks\_of\_food*  
    
- *list\_of\_goods*

**Education:**

- *completed\_education*

**Investments:**

- *list\_of\_investments*

### Available Goods

- Microwave  
    
- Refrigerator  
    
- Freezer  
    
- Stove  
    
- Color TV  
    
- Stereo  
    
- Computer  
    
- Hot tub  
    
- Atlas  
    
- Black & White TV  
    
- VCR  
    
- Theatre Tickets  
    
- 8-Track Player

### Newspaper System

- Newspaper appears as an overlay when events occur  
    
- Contains announcements about:

    \- Robberies

    \- Economic changes

    \- Special events

    \- Game progress milestones

    \- Random events

- Acts as the primary narrative device

### Menu System

- Main Menu  
    
- Save/Load Menu  
    
- Options Menu  
    
- Help/Tutorial  
    
- Goal Configuration

## CHARACTERS

### Player Character Customization

- Name selection  
    
- Avatar selection (4-6 character options)  
    
- Starting attribute distribution  
    
- Goal customization

### AI Opponents

- Difficulty levels:

    \- Easy: Makes suboptimal decisions

    \- Medium: Makes generally good decisions

    \- Hard: Makes highly optimized decisions

- Personality types affecting strategy:

    \- Career Climber: Focuses on job advancement

    \- Academic: Prioritizes education

    \- Consumer: Focuses on purchasing items

    \- Balanced: Spreads focus evenly

### NPCs

- Employers (for job interviews)  
    
- Store clerks  
    
- Landlord  
    
- University staff  
    
- Bank tellers

## ENVIRONMENTS

### The Board

The main game interface consists of:

- A central rectangular area where most user interactions take place  
    
- 13 location icons surrounding the central area  
    
- Each location provides different services and opportunities  
    
- Players navigate between locations, spending time units for travel

### Locations

||||||

|---|---|---|---|---|

|**Le Security**|**Rent Office**|**Low Cost Housing**|**Pawn Shop**|**Z-Mart**|

|**Black's Market**||||**Monolith Burgers**|

|**Bank**||||**QT Clothing**|

|**Factory**|**Employment Office**|**Clock**|**Hi Tech U**|**Socket City**|

#### Location Services

**Le Security**

- Relax  
    
- Done

**Rent Office**

- Pay rent  
    
- Housing options

**Low Cost Housing**

- Relax  
    
- Done

**Pawn Shop**

- Buy  
    
- Sell  
    
- Pawn

**Z-Mart Discount**

- Items for sale:

    \- Stove \- $529

    \- Stereo \- $486

    \- Black & White TV \- $118

    \- VCR \- $270

    \- Theatre Tickets \- $32

    \- 8-Track Player \- $81

- Alternating items:

    \- Refrigerator

    \- Baseball Tickets

    \- Dictionary

    \- Works of Capote

**Monolith Burgers**

- Food items (see Hunger System)

**QT Clothing**

- Clothing items (see Clothing System)

**Socket City Appliance**

- Refrigerator \- $902  
    
- Freezer \- $528  
    
- Stove \- $587  
    
- Color TV \- $540  
    
- VCR \- $342  
    
- Stereo \- $424  
    
- Microwave \- $339  
    
- Hot Tub \- $1292  
    
- Computer \- $1646

**Hi-Tech University**

- Education options (see Education System)  
    
- Enrollment fee: $50

**Employment Office**

- Job listings (see Career System)  
    
- Job applications

**Bank**

- Deposit $100  
    
- Withdraw $100  
    
- Loan Payments  
    
- Apply for Loan  
    
- Investment options (see Economy System)

**Black's Market**

- Food options (see Hunger System)  
    
- Lottery tickets ($10 for 10 tickets)  
    
- Newspaper ($1, triggers newspaper event)

## PROGRESSION

### Player Advancement

- Skills increase through education and job experience  
    
- Higher education unlocks better job opportunities  
    
- Better jobs provide more income for purchases  
    
- Quality of life improvements from better housing and possessions

### Game Pacing

- Early Game: Focus on basic needs and entry-level jobs  
    
- Mid Game: Education advancement and career development  
    
- Late Game: High-level career and luxury acquisitions

### Victory Conditions

- Players continue taking turns until someone reaches all four life goals  
    
- First player to reach their set goals wins  
    
- Different strategies can lead to victory

### Difficulty Scaling

- AI opponents advance at different rates based on difficulty  
    
- Inflation/deflation cycles affect economy  
    
- Job requirements become more competitive

## TECHNICAL SPECIFICATIONS

### Target Platforms

- Initial release: Web-based application  
    
- Planned ports: iOS and Android mobile apps  
    
- Responsive design for various screen sizes

### Performance Requirements

- Low system requirements to ensure accessibility  
    
- Target framerate: 60 FPS  
    
- Memory usage: \<500MB  
    
- Mobile-friendly UI/UX design

### Development Environment

- Frontend: HTML5, CSS3, JavaScript/TypeScript  
    
- Framework options: React    
    
- Backend options (if needed): Node.js, Firebase  
    
- Mobile conversion: React Native or Progressive Web App

### Save System

- Multiple save slots  
    
- Auto-save after each turn  
    
- Save data includes:

    \- Player stats and inventory

    \- AI opponent status

    \- Game board state

    \- Economic conditions

- Cloud save support for cross-platform play

## ASSET REQUIREMENTS

### Visual Assets

- Character portraits (6-8 per character type)  
    
- Location backgrounds (15-20 total)  
    
- UI elements (50+ individual assets)  
    
- Item icons (100+ items)  
    
- Effects and transitions  
    
- Newspaper templates  
    
- Robbery animation/notification graphics

### Audio Assets

- Background music (5-8 tracks)  
    
- UI sound effects (15-20 sounds)  
    
- Ambient location sounds (10-15 sounds)  
    
- Character reaction sounds  
    
- Victory/defeat jingles  
    
- Newspaper appearance sound  
    
- Robbery alarm sound

### Text Content

- Tutorial content  
    
- Item descriptions  
    
- Job descriptions  
    
- Course descriptions  
    
- Random event text  
    
- Character dialogue  
    
- Newspaper headlines and stories

## PROJECT TIMELINE

### Pre-Production Phase (2 weeks)

- Finalize GDD  
    
- Set up development environment  
    
- Create asset pipeline  
    
- Establish version control and project management

### Alpha Phase (6 weeks)

- Core game mechanics implementation  
    
- Basic UI framework  
    
- Placeholder assets  
    
- Functional game loop

### Beta Phase (6 weeks)

- Complete gameplay systems  
    
- AI opponent implementation  
    
- Final art assets integration  
    
- Balancing and tuning

### Polish Phase (3 weeks)

- Bug fixing  
    
- Performance optimization  
    
- User experience improvements  
    
- Final balancing

### Release (1 week)

- Final testing  
    
- Build preparation  
    
- Documentation  
    
- Release deployment

## ADDITIONAL NOTES

### Future Expansion Possibilities

- Multiplayer online mode  
    
- Additional characters and careers  
    
- Expanded city with new locations  
    
- Mobile port with touch controls  
    
- Custom scenario editor

### Accessibility Considerations

- Colorblind mode  
    
- Text size options  
    
- Control remapping  
    
- Difficulty customization

---

*This document is subject to revision as development progresses*

\*\*  