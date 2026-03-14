const express = require('express');
const {
  getAssignedTests,
  startTest,
  saveAnswer,
  submitTest,
  getMyResults,
  getAllResults,
} = require('../controllers/studentTestController');
const { auth, isStudent, isAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/my-tests', auth, isStudent, getAssignedTests);
router.post('/my-tests/:testId/start', auth, isStudent, startTest);
router.put('/my-tests/session/:resultId/answer', auth, isStudent, saveAnswer);
router.post('/my-tests/session/:resultId/submit', auth, isStudent, submitTest);
router.get('/my-results', auth, isStudent, getMyResults);
router.get('/results', auth, isAdmin, getAllResults);

module.exports = router;
