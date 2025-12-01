# IT Asset Register

**IT Asset Register** is an internal full-stack web application designed for managing and registering IT assets within company. This tool provides a centralized system to keep track of all IT assets, as well as the employees currently assigned to each asset.

> **Note:** This tool is still under development.

## Why This Project?

As the only employee in the IT department, I found that our company did not have any management system for IT assets. Rather than relying on Excel sheets for manual tracking—which can be error-prone and hard to maintain—I decided to develop my own system. This web app ensures better accountability and makes it easier to provide records if they are ever requested.

---

## Key Features

- **Asset Management**
  - Create, edit, and list assets.
  - Track detailed asset information: serial number, type, status, assigned staff, purchase/assignment dates, asset number, notes, and changelogs.
  - Assign and unassign assets to staff, with tracking of assignment history.

- **Staff Management**
  - Create, edit, and list staff.
  - Track staff details: name, email, department, job title, status, note, asset history, and changelog.
  - Update staff status and notes.

- **Assignment & Removal**
  - Assign assets to staff with confirmation for reassignment.
  - Remove asset assignments with consistent historical tracking.
  - Assignment and removal logic updates both asset and staff history, and logs all changes.

- **Authentication & Authorization**
  - User login via Microsoft Entra ID.
  - Role-based access: "admin" (full access), "viewer" (read-only).
  - Only users with organization emails can sign in.

- **Audit Trails**
  - Change logs for both assets and staff, maintaining history of all changes with who, when, and what was changed.

- **User Interface**
  - Admin dashboard for asset and staff register/ management.
  - Detail and edit pages for assets and staff, with permissions based on user roles.

---

## Tech Stack

- **Backend**: Node.js (TypeScript), Fastify, Drizzle ORM, custom route handlers, OpenAPI (with Orval for API client generation).
- **Frontend**: Next.js (React), TypeScript, Tailwind CSS, React Hook Form, Zod for validation.
- **Authentication**: next-auth with Microsoft Entra ID provider.
- **Database**: PostgreSQL, accessed via Drizzle ORM, ensuring type safety and maintainability.
- **API**: OpenAPI-based, providing a clear contract between frontend and backend.

---

## Data Integrity & Security

- Transactional updates for assignments to prevent data inconsistencies.
- Role-based access enforced both in frontend and backend.
- Append-only asset history to preserve all past assignments for audit and compliance.

---

## Test

> **Working on it.** 

---

## Getting Started

> **Project is currently under active development.**

## Deployment Guide (Internal Server)

### Prerequisites

- **Windows Server** (IIS installed, Application Request Routing & URL Rewrite modules)
- **Node.js** (LTS version)
- **PostgreSQL** (installed locally or on a dedicated server)
- **Internal DNS** entry for your app (e.g., `itassetregister.company.local`)
- **Firewall** rules allowing ports 80 (HTTP), 443 (HTTPS), and 3333 (API)

### Steps

1. **Build the Frontend**
   - On your dev machine:
     ```
     npm run build
     ```
   - Copy the `.next/`, `public/`, Orval-generated files, and all config files to the server’s web folder.

2. **Build the Backend**
   - On your dev machine:
     ```
     npm run build
     ```
   - Copy the updated files to the server’s backend folder.

3. **Configure IIS**
   - Set up a site with the physical path pointing to your web folder.
   - Add HTTP (80) and HTTPS (443) bindings for your internal DNS name.
   - Assign a self-signed certificate (created for your DNS name) to the HTTPS binding.
   - Enable ARR and URL Rewrite to proxy all requests to your Next.js app (e.g., `http://localhost:3000/{R:0}`).

4. **Configure Internal DNS**
   - Add an A record for `itassetregister.company.local` pointing to your server’s IP.

5. **Configure Firewall**
   - Allow inbound traffic on ports 80, 443, and 3333.

6. **Install and Trust Certificate**
   > **May not be necessary, do step 8. and try step 9. before**
   - Export the self-signed certificate and install it in the “Trusted Root Certification Authorities” store on all client machines.

8. **Start the Next.js App**
   - On the server, run:
     ```
     npm run start
     ```
   - On the web, run
     ```
     npm run start
     ```

9. **Test Access**
   - From a client, visit `https://itassetregister.company.local` and sign in with Microsoft Entra ID.

---

**Notes:**
- For API client generation (Orval), run it on the server or use a local OpenAPI file if remote fetch fails.
- Update `.env` and `.env.local` files to match your server’s configuration.
- Redo IIS after copying new files or changing bindings.


## Contributing

Please open an issue or pull request to discuss any changes.

## License

This project is intended for internal use. License details to be determined.

---

*Developed by [JosueDilmo](https://github.com/JosueDilmo) for internal IT asset management within the company.*
