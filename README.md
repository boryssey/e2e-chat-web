# ChatE2E

## About
It is a very simple E2E encrypted chat app that doesn't require email or phone number to register. Uses Signal Protocol to handle E2E encryption and stores client data in the encrypted IndexedDB.

## Getting Started

First, run the development server:

```bash
pnpm install
pnpm dev

```



## Links

- [Backend repository](https://github.com/boryssey/e2e-chat-backend)
- [Production deployment](https://chate2e.com)
- [Task Board](https://github.com/users/boryssey/projects/2/views/1)


## Tech Stack
- React - Frontend
- Next.js - Frontend React Framework
- [Libsignal Protocol Typescript](https://github.com/privacyresearchgroup/libsignal-protocol-typescript) - E2E encryption
- Fastify.io - Backend framework
- Socket.io - Websocket handling
- Vercel - Frontend Infrustructure
- AWS EC2 - VPS hosting the Backend
- PostgreSQL - Relational Database, hosted on AWS RDS
- Cloudflare - DNS, privacy-friendly Web Analytics
