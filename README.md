# Internshala Clone

A full-stack web application for managing internships and jobs.

## Frontend (Internarea)

### Overview
The frontend is built with Next.js (React) and features:
- Real-time job and internship listings
- Admin dashboard for managing applications
- User authentication
- Responsive design

### Features
- Browse internships and jobs
- Apply to positions
- Admin login and management
- Search and filtering

### Tech Stack
- Next.js 15.2.1
- React 19
- TypeScript
- Redux Toolkit
- Tailwind CSS
- Axios for API calls

### Running
1. Navigate to `internarea/` directory
2. Run `npm run dev` to start the development server
3. The app will be available at `http://localhost:3000`

## Backend (Internshala)

### Overview
The backend is a Node.js/Express application with MongoDB integration.

### Features
- REST API endpoints for jobs, internships, and applications
- User authentication
- Admin login functionality
- Database operations with Mongoose

### Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- CORS, Body Parser

### Running
1. Navigate to `backend/` directory
2. Run `npm run dev` to start the server
3. The backend will be available at `http://localhost:5000`

## API Endpoints

### Jobs
- `GET /api/job` - Get all jobs
- `POST /api/job` - Create a new job
- `GET /api/job/:id` - Get job by ID

### Internships
- `GET /api/internship` - Get all internships
- `POST /api/internship` - Create a new internship
- `GET /api/internship/:id` - Get internship by ID

### Applications
- `GET /api/application` - Get all applications
- `POST /api/application` - Create a new application
- `GET /api/application/:id` - Get application by ID
- `PUT /api/application/:id` - Update application status

### Admin
- `POST /api/admin/adminlogin` - Admin login

## Development

### Prerequisites
- Node.js 18+
- MongoDB (running locally or remote)

### Installation
```bash
1. Clone the repository
2. Navigate to backend/ and run: npm install
3. Navigate to internarea/ and run: npm install
```

### Environment Variables

Create a `.env` file in the backend directory:
```
DATABASE_URL=mongodb://127.0.0.1:27017/internshala
```

### Testing
To test the application locally:
1. Start MongoDB
2. Start the backend server (`npm run dev` in backend/)
3. Start the frontend development server (`npm run dev` in internarea/)
4. Visit `http://localhost:3000` in your browser

## Project Structure

- `backend/` - Node.js/Express server
- `backend/Middleware/` - Route middleware
- `backend/Model/` - Mongoose schemas
- `backend/Routes/` - Express router files
- `backend/.env` - Environment variables
- `backend/package.json` - Backend dependencies
- `backend/.gitignore` - Git ignore file

- `internarea/` - Next.js frontend
- `internarea/src/` - React source code
- `internarea/src/pages/` - Next.js pages
- `internarea/src/Components/` - Reusable components
- `internarea/src/lib/` - API utilities
- `internarea/src/store/` - Redux store
- `internarea/package.json` - Frontend dependencies
- `internarea/README.md` - Frontend README (this file)

## Notes

This is a clone of the Internshala platform with similar functionality for managing internships and job opportunities.