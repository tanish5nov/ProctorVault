# MERN Stack Implementation Plan

## Project Overview
A university online examination platform built with MERN (MongoDB, Express, React, Node.js) where administrators can manage subjects, questions, and tests, while students can take scheduled tests.

---

## Tech Stack

### Frontend (React)
- React 18.x
- React Router v6 for navigation
- Axios for API calls
- Context API/Redux for state management
- Material-UI or Tailwind CSS for styling
- React Hook Form for form management
- Sweet Alert or Toast notifications

### Backend (Node.js + Express)
- Express.js
- JWT for authentication
- Bcrypt for password hashing
- Mongoose for MongoDB ODM
- Dotenv for environment variables
- CORS for cross-origin requests
- Express Validator for input validation

### Database (MongoDB)
- MongoDB Atlas (or local MongoDB)
- Mongoose schemas for data modeling

---

## Project Structure

```
NewEval/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Question.js
│   │   ├── Test.js
│   │   └── TestResult.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── subjects.js
│   │   ├── questions.js
│   │   ├── tests.js
│   │   └── results.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── subjectController.js
│   │   ├── questionController.js
│   │   ├── testController.js
│   │   └── resultController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── .env
│   ├── config.js
│   └── server.js
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js
│   │   │   ├── PrivateRoute.js
│   │   │   └── [other components]
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── ManageSubjects.js
│   │   │   ├── ManageQuestions.js
│   │   │   ├── ManageTests.js
│   │   │   ├── TakeTest.js
│   │   │   ├── TestResults.js
│   │   │   └── StudentResults.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.js
│   │   └── index.js
│   ├── .env
│   └── package.json
│
└── plan.md
```

---

## Database Schema Design

### User
```
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  persona: Enum ["Admin", "Student"],
  createdAt: Date
}
```

### Subject
```
{
  _id: ObjectId,
  subjectId: String (unique),
  subjectName: String,
  createdBy: ObjectId (refers User - Admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Question
```
{
  _id: ObjectId,
  questionId: String (unique),
  statement: String (including options if MCQ),
  correctAnswer: String (uppercase),
  subject: ObjectId (refers Subject),
  createdBy: ObjectId (refers User - Admin),
  createdAt: Date,
  updatedAt: Date
}
```

### Test
```
{
  _id: ObjectId,
  testId: String (unique),
  testName: String,
  createdBy: ObjectId (refers User - Admin),
  startTime: DateTime,
  endTime: DateTime,
  createdAt: Date,
  updatedAt: Date
}
```

### TestQuestions (Many-to-Many relationship)
```
{
  _id: ObjectId,
  testId: ObjectId (refers Test),
  questionId: ObjectId (refers Question),
  assignedMarks: Number
}
```

### TestResult
```
{
  _id: ObjectId,
  testId: ObjectId (refers Test),
  studentId: ObjectId (refers User - Student),
  answers: Array [{ questionId, selectedAnswer (uppercase), isCorrect }],
  totalMarks: Number,
  obtainedMarks: Number,
  startedAt: DateTime,
  submittedAt: DateTime,
  status: Enum ["InProgress", "Submitted"],
  createdAt: Date
}
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Subjects (Admin only)
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects/:id` - Update subject
- `DELETE /api/subjects/:id` - Delete subject

### Questions (Admin only)
- `GET /api/questions` - Get all questions
- `GET /api/questions?subject=:subjectId` - Get questions by subject
- `POST /api/questions` - Create new question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question

### Tests (Admin)
- `GET /api/tests` - Get all tests
- `POST /api/tests` - Create new test
- `PUT /api/tests/:id` - Update test
- `DELETE /api/tests/:id` - Delete test
- `GET /api/tests/:id/questions` - Get questions for a test
- `POST /api/tests/:id/assign-students` - Assign students to test

### Test Taking (Students)
- `GET /api/my-tests` - Get scheduled tests for student
- `POST /api/start-test/:testId` - Start a test (create TestResult entry)
- `POST /api/submit-answer` - Submit answer for a question
- `POST /api/end-test/:testId` - End/Submit test

### Results
- `GET /api/results` - Get all test results (Admin)
- `GET /api/my-results` - Get student's results (Student)
- `GET /api/results/:resultId` - Get detailed result
- `POST /api/evaluate-test/:resultId` - Evaluate test answers

---

## Key Features

### Frontend Features

#### Authentication Pages
- User registration (with persona selection)
- User login
- Protected routes based on persona

#### Admin Dashboard
1. **Subject Management**
   - View all subjects
   - Add new subject
   - Edit subject
   - Delete subject

2. **Question Bank Management**
   - View all questions
   - Filter by subject
   - Add new question (with statement including options)
   - Edit question
   - Delete question

3. **Test Management**
   - Create test with name, start time, end time
   - Add questions to test with marks assignment
   - Assign students to test
   - View test details
   - Edit test (if not started)
   - Delete test

4. **Results Dashboard**
   - View all test results
   - Filter by test or student
   - View detailed results with answers
   - View student performance analytics

#### Student Dashboard
1. **Test List**
   - View all scheduled tests
   - Filter tests by status (Upcoming, Ongoing, Past)
   - View test details

2. **Take Test**
   - Timer showing remaining time
   - Question navigation (Previous/Next)
   - Mark for review feature
   - Auto-submit when time ends
   - Submit test manually
   - **Answer standardization**: All student answers automatically converted to uppercase for consistency (e.g., "a" → "A")

3. **Results**
   - View all past test results
   - View detailed result with answers
   - Performance metrics

### Backend Features

#### Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin vs Student)
- Protected routes with middleware

#### Business Logic
- Prevent test access outside scheduled time
- **Test time validation**: startTime must be less than endTime
- Auto-submit test when time ends
- Prevent re-entry to completed test
- Auto-evaluation of answers
- Marks calculation

#### Validation
- Email validation
- Input sanitization
- Test time validation: startTime < endTime (must be enforced on both frontend and backend)
- Student answer standardization: Convert all answer inputs to uppercase before validation and storage (e.g., "a" → "A", "b" → "B")

---

## Implementation Phases

### Phase 1: Setup & Backend Foundation
- [ ] Setup project structure
- [ ] Setup MongoDB connection
- [ ] Create User model and authentication
- [ ] Implement JWT authentication
- [ ] Create basic CRUD routes

### Phase 2: Core Backend APIs
- [ ] Subject management APIs
- [ ] Question bank APIs
- [ ] Test creation and management APIs
- [ ] Test result tracking APIs

### Phase 3: Frontend Setup & Auth
- [ ] Setup React app
- [ ] Create authentication pages (Login/Register)
- [ ] Setup routing
- [ ] Implement Context API for authentication

### Phase 4: Admin Features
- [ ] Subject management UI
- [ ] Question bank management UI
- [ ] Test creation and management UI
- [ ] Results dashboard

### Phase 5: Student Features
- [ ] Student dashboard
- [ ] Test taking interface with timer
- [ ] Results view

### Phase 6: Testing & Deployment
- [ ] API testing
- [ ] Bug fixes and optimization
- [ ] Deploy backend (Heroku/Render)
- [ ] Deploy frontend (Vercel/Netlify)

---

## Development Considerations

### Performance
- Pagination for large datasets (questions, results)
- Caching frequently accessed data
- Optimize database queries with proper indexing

### UX/UX
- Clear navigation between different personas
- Real-time timer during test
- Loading states and error messages
- Responsive design for mobile/tablet

### Security
- Validate all inputs on frontend and backend
- Secure password storage
- Token expiration and refresh mechanism
- HTTPS in production

### Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Frontend component testing

---

## Next Steps
1. Review this implementation plan
2. Confirm if any changes are needed
3. Begin Phase 1: Project Setup & Backend Foundation
4. Create backend scaffolding and database models
5. Create frontend scaffolding and authentication flow

---

Would you like me to proceed with the implementation? Any modifications needed to this plan?
