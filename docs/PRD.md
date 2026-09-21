# Tournament Arena - Product Requirements Document

## Product overview

Tournament Arena is a web platform for discovering, joining, and operating
competitive gaming tournaments. It brings tournament listings, player and team
registration, game-room participation, in-room communication, wallet payments,
and tournament administration into one place.

The product supports both solo players and teams. Players can create an account,
verify their email, maintain a wallet, register for tournaments, submit their
game ID for approval, and communicate with other participants in a live room.
Administrators can create and manage tournaments, approve participant details,
review deposits and withdrawals, and oversee tournament operations.

## Problem statement

Competitive gaming participants often depend on disconnected tools to find
tournaments, register, pay entry fees, coordinate with teammates, submit game
identifiers, and receive updates. This creates avoidable friction for players
and makes it difficult for organizers to maintain accurate participant records
and enforce a consistent approval process.

Tournament Arena addresses this by providing a single, responsive platform
where participants can move from tournament discovery to verified registration
and room participation, while administrators retain the controls needed to run
tournaments reliably.

## Goals

### Product goals

- Make relevant tournaments easy to discover and understand.
- Provide a simple registration experience for both solo players and teams.
- Establish a trusted participant flow through email verification and game ID
  approval.
- Make entry-fee deposits, wallet balances, withdrawals, and prize payouts
  visible and manageable.
- Give participants a shared room for tournament communication.
- Give administrators one dashboard for tournament and participant operations.
- Provide a responsive experience that works on desktop and mobile devices.

### MVP success indicators

- A new user can register, verify their email, log in, and complete a
  tournament registration without administrator assistance for routine steps.
- A player can join as an individual or create/invite a team where the
  tournament supports team play.
- Administrators can review and approve game IDs and manage tournament-related
  payment requests from the admin dashboard.
- Registered participants can access the relevant room and exchange live
  messages.

## Target users

### Players

Competitive gamers who want to discover tournaments, pay an entry fee, join a
room, submit their game ID, and track their participation from one account.

### Team captains and team members

Players who compete together and need to create a team, invite teammates, and
complete registration as a coordinated group.

### Tournament administrators and organizers

People responsible for publishing tournaments, managing rooms and
registrations, approving participant game IDs, reviewing payment activity, and
overseeing results and payouts.

## Core features (MVP)

### 1. Account creation and authentication

- User registration with email verification using a six-digit OTP or
  verification link.
- Login protection for accounts that have not completed email verification.
- JWT-based authenticated sessions.
- Account and profile information available to the signed-in user.

### 2. Tournament discovery and details

- Browse available tournaments.
- View tournament details, including the format, schedule, entry requirements,
  and participation status.
- Support for solo and team tournament formats.

### 3. Solo and team registration

- Register as an individual for eligible tournaments.
- Create a team and invite team members.
- Join an existing team when invited.
- Show registration state and required next steps to participants.

### 4. Game ID submission and approval

- Let participants submit the game ID required for tournament participation.
- Track pending, approved, or rejected game ID submissions.
- Let administrators review and approve participant game IDs.

### 5. Wallet and payments

- Display the participant wallet balance and transaction history.
- Support wallet deposits through Razorpay.
- Support withdrawal requests and administrator review.
- Record entry-fee transactions and make eligible prize payouts manageable
  through the platform.

### 6. Tournament rooms and live chat

- Create or join a tournament game room after meeting participation
  requirements.
- Display room participants and relevant tournament context.
- Provide live room chat using WebSockets.
- Persist room messages so participants can review recent communication.

### 7. Administration

- React-based admin dashboard for tournament operations.
- Manage tournaments, rooms, registrations, game ID approvals, deposits, and
  withdrawals.
- Provide Django administration for direct model and database administration.
- Keep administrative actions protected from regular participant accounts.

### 8. Responsive web experience

- Provide usable tournament, registration, wallet, room, and admin workflows
  on desktop and mobile screen sizes.
- Surface clear loading, validation, approval, and payment states.

## MVP boundaries

The MVP focuses on the complete tournament participation loop: account
verification, tournament discovery, solo or team registration, wallet
transactions, game ID approval, room access, live chat, and core
administration. Advanced matchmaking, native mobile applications, automated
anti-cheat systems, and social features beyond tournament-room chat are outside
the MVP unless added through a later product decision.