# Expectations

It is a platform to serve a university where there will two kinds of personas i.e Teachers (Administrators) and Students.

## Subject List

CRUD by admin

- where list of subjects will be maintained
- Contains: SubjectId, SubjectName

## Question Bank

CRUD by admin only

- the question will contain: [all are mandatory]
  - Statement (including options if MCQ)
  - A correct answer [stored always as upper case letters, to impose standardization]
  - subject it belongs to
- Contains: QuestionID, Statement, Subject (refers Subjects), CreatedBy (refers User [should be admin]), CorrectAnswer

## User Params

- UserID
- User Name
- Password
- User Persona (Admin, Student)

## Admin Rights

- can create a test
- can perform CRUD on subjects, question bank
- has access to students database
- for a test, they can pick any student, picked students will see the scheduled test and can take the test

## Student Rights

- can login to platform, will see what all tests are scheduled
- can take any scheduled test

## Test DB

There will be 2 things (calling them tables as of now, but since using mongo so can't say them tables):

### TestList

- Will contain information about every test
- for every created test there will be an entry created in the TestList containing:
  - TestID
  - TestName
  - CreatedBy (refers to User)
  - StartTime
  - EndTime

### TestQuestions

- Will contain list of all the questions in the Test
- contains:
  - TestID (refers TestList)
  - QuestionID (refers QuestionBank)
  - AssignedMarks

## Test

- Test will contain several questions
- Test will be scheduled from "some data time" to "some data time"
- Test will only be available to be given between it's start time and end time
- Each question in the test will be given some marks
- Test will have a name
- there will be a test db, once any student enters the test their entry will be created in the test db
- once the test will end (test endTime reached), or student (ended/submitted/exited/closed tab) the test will be considered submitted
- student cannot re-enter the test later
- student's scores will be evaluated and will be updated in TestResultsDB
- any time admins can access the TestResultsDB